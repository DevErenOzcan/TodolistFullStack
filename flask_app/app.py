from flask import Flask, render_template, jsonify, request
import requests
import json
import time
import os
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading
from datetime import datetime

app = Flask(__name__)

# Configure Flask to work with /analytics prefix
app.config['APPLICATION_ROOT'] = '/analytics'

# Konfigürasyon - ortam değişkenlerinden al
PROMETHEUS_URL = os.getenv("PROMETHEUS_URL")
LLM_URL = os.getenv("LLM_URL") + "chat/completions"

# Thread-safe counter for progress tracking
class ProgressCounter:
    def __init__(self):
        self._lock = threading.Lock()
        self._count = 0
        self._successful = 0

    def increment_total(self):
        with self._lock:
            self._count += 1
            return self._count

    def increment_successful(self):
        with self._lock:
            self._successful += 1
            return self._successful

    def get_counts(self):
        with self._lock:
            return self._count, self._successful

    def reset(self):
        with self._lock:
            self._count = 0
            self._successful = 0

# Global değişkenler
current_analysis = None
analysis_history = []
progress_counter = ProgressCounter()

def get_all_metric_names():
    """Prometheus'tan tüm metrik adlarını çeker."""
    url = f"{PROMETHEUS_URL}/api/v1/label/__name__/values"

    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        data = response.json()

        if data['status'] == 'success':
            return data['data']
        else:
            return []

    except requests.exceptions.RequestException as e:
        print(f"Metrik adları çekilirken hata oluştu: {e}")
        return []

def fetch_metric_data(metric_name, hours=1):
    """Belirli bir metrik için son X saatlik veriyi çeker."""
    end_time = int(time.time())
    start_time = end_time - (hours * 3600)

    url = f"{PROMETHEUS_URL}/api/v1/query_range"
    params = {
        'query': metric_name,
        'start': start_time,
        'end': end_time,
        'step': '60s'
    }

    try:
        response = requests.get(url, params=params, timeout=30)
        response.raise_for_status()
        data = response.json()

        if data['status'] == 'success':
            return data['data']['result']
        else:
            return None

    except requests.exceptions.RequestException as e:
        return None

def fetch_single_metric(metric_name, total_metrics, counter):
    """Tek bir metrik için veri çeker - paralel işleme için optimize edilmiş"""
    counter.increment_total()
    metric_data = fetch_metric_data(metric_name)

    if metric_data is not None:
        counter.increment_successful()
        return metric_name, metric_data
    else:
        return metric_name, None

def send_metrics_to_llm(metrics_data, model="ai/qwen3:8B-Q4_0"):
    """Toplanan metrik verilerini LLM'e gönderir ve analiz ister."""
    
    # Metrik verilerini özetleyici bir format hazırla
    metrics_summary = {
        "total_metrics": len(metrics_data),
        "metrics_with_data": len([k for k, v in metrics_data.items() if v]),
        "sample_metrics": list(metrics_data.keys())[:10]
    }

    # LLM için sistem mesajı
    system_message = """Sen Prometheus metriklerini analiz eden uzman bir sistem yöneticisisin. 
    Verilen metrik verilerini analiz et ve şunları yap:
    1. Sistem durumu hakkında genel bir değerlendirme yap
    2. Dikkat çeken metrikler varsa belirt
    3. Potansiyel sorunlar varsa uyar
    4. Performans önerileri sun
    5. Sonucu HTML formatında döndür (sadece body içeriği)
    Türkçe yanıt ver."""

    # Kullanıcı mesajı
    user_message = f"""Aşağıdaki Prometheus metrik verilerini analiz et:
    
    Toplam metrik sayısı: {metrics_summary['total_metrics']}
    Veri içeren metrik sayısı: {metrics_summary['metrics_with_data']}
    
    Mevcut metrikler: {', '.join(metrics_summary['sample_metrics'])}
    
    Detaylı veri (özet):
    {json.dumps(dict(list(metrics_data.items())[:5]), indent=2, ensure_ascii=False)[:3000]}...
    """

    # LLM API isteği
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_message},
            {"role": "user", "content": user_message}
        ],
        "temperature": 0.7,
        "max_tokens": -1,
        "stream": False
    }

    try:
        response = requests.post(
            LLM_URL,
            headers={"Content-Type": "application/json"},
            json=payload
        )
        response.raise_for_status()

        result = response.json()

        if "choices" in result and len(result["choices"]) > 0:
            analysis = result["choices"][0]["message"]["content"]
            return analysis
        else:
            return None

    except requests.exceptions.RequestException as e:
        return f"LLM isteği başarısız: {str(e)}"
    except Exception as e:
        return f"LLM analizi sırasında hata: {str(e)}"

def fetch_and_analyze_metrics(max_workers=10):
    """Tüm metrik adlarını çeker, paralel olarak veri alır ve LLM'e gönderir."""
    global current_analysis, progress_counter
    
    progress_counter.reset()
    
    metric_names = get_all_metric_names()
    if not metric_names:
        return {"error": "Hiç metrik bulunamadı!"}

    all_metrics_data = {}
    total_metrics = len(metric_names)

    # Paralel işleme ile metrik verilerini çek
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        future_to_metric = {
            executor.submit(fetch_single_metric, metric_name, total_metrics, progress_counter): metric_name
            for metric_name in metric_names
        }

        for future in as_completed(future_to_metric):
            try:
                metric_name, metric_data = future.result()
                if metric_data is not None:
                    all_metrics_data[metric_name] = metric_data
            except Exception as exc:
                continue

    # İstatistikler
    processed, successful = progress_counter.get_counts()
    
    # LLM analizi
    analysis = send_metrics_to_llm(all_metrics_data)
    
    result = {
        "timestamp": datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        "total_processed": processed,
        "successful": successful,
        "failed": processed - successful,
        "total_metrics_with_data": len(all_metrics_data),
        "analysis": analysis,
        "sample_metrics": list(all_metrics_data.keys())[:20]
    }
    
    current_analysis = result
    analysis_history.append(result)
    
    return result

# Flask Routes with /analytics prefix
@app.route('/analytics')
@app.route('/analytics/')
def index():
    """Ana sayfa"""
    return render_template('index.html')

@app.route('/analytics/static/<path:filename>')
def analytics_static(filename):
    """Static dosyaları serve et"""
    from flask import send_from_directory
    return send_from_directory('static', filename)

@app.route('/analytics/api/analyze', methods=['POST'])
def analyze_metrics():
    """Metrik analizi başlat"""
    try:
        data = request.get_json()
        max_workers = data.get('max_workers', 10)
        
        result = fetch_and_analyze_metrics(max_workers)
        return jsonify(result)
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/analytics/api/progress')
def get_progress():
    """İşlem durumunu döndür"""
    processed, successful = progress_counter.get_counts()
    return jsonify({
        "processed": processed,
        "successful": successful
    })

@app.route('/analytics/api/current')
def get_current_analysis():
    """Mevcut analizi döndür"""
    if current_analysis:
        return jsonify(current_analysis)
    else:
        return jsonify({"error": "Henüz analiz yapılmadı"}), 404

@app.route('/analytics/api/history')
def get_analysis_history():
    """Analiz geçmişini döndür"""
    return jsonify(analysis_history[-10:])  # Son 10 analizi döndür

# Keep the original routes for backward compatibility
@app.route('/')
def root_redirect():
    """Root path'i analytics'e yönlendir"""
    from flask import redirect
    return redirect('/analytics')

@app.route('/api/analyze', methods=['POST'])
def analyze_metrics_compat():
    """Backward compatibility"""
    return analyze_metrics()

@app.route('/api/progress')
def get_progress_compat():
    """Backward compatibility"""
    return get_progress()

@app.route('/api/current')
def get_current_analysis_compat():
    """Backward compatibility"""
    return get_current_analysis()

@app.route('/api/history')
def get_analysis_history_compat():
    """Backward compatibility"""
    return get_analysis_history()

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
