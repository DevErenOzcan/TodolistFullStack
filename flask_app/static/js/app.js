// Prometheus Metrics Analyzer JavaScript

let analysisInProgress = false;
let progressInterval;
let currentAnalysis = null;

// DOM yüklendiğinde
document.addEventListener('DOMContentLoaded', function() {
    // Mevcut analizi yükle
    loadCurrentAnalysis();
});

// Analizi başlat
async function startAnalysis() {
    if (analysisInProgress) return;

    const maxWorkers = parseInt(document.getElementById('maxWorkers').value);
    const analyzeBtn = document.getElementById('analyzeBtn');
    
    // UI'ı güncelle
    analysisInProgress = true;
    analyzeBtn.disabled = true;
    analyzeBtn.innerHTML = '<div class="loading-spinner me-2"></div>Analiz Yapılıyor...';
    
    showStatus('Analiz başlatılıyor...', 'info');
    showProgressSection();
    hideResultsSection();

    try {
        // Progress takibi başlat
        startProgressTracking();

        // Analiz API'sini çağır
        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                max_workers: maxWorkers
            })
        });

        const result = await response.json();

        if (response.ok) {
            currentAnalysis = result;
            displayResults(result);
            showStatus('Analiz tamamlandı!', 'success');
        } else {
            showStatus(`Hata: ${result.error}`, 'danger');
        }

    } catch (error) {
        console.error('Analiz hatası:', error);
        showStatus(`Bağlantı hatası: ${error.message}`, 'danger');
    } finally {
        // UI'ı sıfırla
        analysisInProgress = false;
        analyzeBtn.disabled = false;
        analyzeBtn.innerHTML = '<i class="fas fa-play me-2"></i>Analizi Başlat';
        stopProgressTracking();
    }
}

// Progress takibini başlat
function startProgressTracking() {
    progressInterval = setInterval(async () => {
        try {
            const response = await fetch('/api/progress');
            const data = await response.json();
            
            updateProgress(data.processed, data.successful);
            
        } catch (error) {
            console.error('Progress hatası:', error);
        }
    }, 1000); // Her saniye güncelle
}

// Progress takibini durdur
function stopProgressTracking() {
    if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
    }
}

// Progress güncelle
function updateProgress(processed, successful) {
    const failed = processed - successful;
    
    document.getElementById('processedCount').textContent = processed;
    document.getElementById('successCount').textContent = successful;
    document.getElementById('failedCount').textContent = failed;
    
    // Progress bar güncelleme (yaklaşık olarak)
    if (processed > 0) {
        const percentage = Math.min(100, (processed / 100) * 100); // Tahmini
        const progressBar = document.getElementById('progressBar');
        const progressText = document.getElementById('progressText');
        
        progressBar.style.width = percentage + '%';
        progressText.textContent = Math.round(percentage) + '%';
    }
}

// Sonuçları göster
function displayResults(result) {
    // Analiz zamanını göster
    document.getElementById('analysisTime').textContent = result.timestamp;
    
    // Analiz içeriğini göster
    const analysisContent = document.getElementById('analysisContent');
    if (result.analysis) {
        analysisContent.innerHTML = result.analysis;
    } else {
        analysisContent.innerHTML = '<div class="alert alert-warning">Analiz sonucu alınamadı.</div>';
    }
    
    // İstatistikleri göster
    document.getElementById('totalProcessed').textContent = result.total_processed;
    document.getElementById('totalSuccessful').textContent = result.successful;
    document.getElementById('totalWithData').textContent = result.total_metrics_with_data;
    
    // Örnek metrikleri göster
    const sampleMetrics = document.getElementById('sampleMetrics');
    sampleMetrics.innerHTML = '';
    
    if (result.sample_metrics && result.sample_metrics.length > 0) {
        result.sample_metrics.forEach(metric => {
            const span = document.createElement('span');
            span.className = 'metric-tag';
            span.textContent = metric;
            sampleMetrics.appendChild(span);
        });
    }
    
    // Sonuç bölümlerini göster
    showResultsSection();
    showMetricsSection();
}

// Mevcut analizi yükle
async function loadCurrentAnalysis() {
    try {
        const response = await fetch('/api/current');
        if (response.ok) {
            const result = await response.json();
            currentAnalysis = result;
            displayResults(result);
        }
    } catch (error) {
        console.log('Mevcut analiz yok');
    }
}

// Geçmişi göster
async function showHistory() {
    try {
        const response = await fetch('/api/history');
        const history = await response.json();
        
        const historyContent = document.getElementById('historyContent');
        historyContent.innerHTML = '';
        
        if (history.length === 0) {
            historyContent.innerHTML = '<div class="alert alert-info">Henüz analiz geçmişi bulunmuyor.</div>';
        } else {
            history.reverse().forEach((analysis, index) => {
                const item = createHistoryItem(analysis, index);
                historyContent.appendChild(item);
            });
        }
        
        // Modal'ı göster
        const modal = new bootstrap.Modal(document.getElementById('historyModal'));
        modal.show();
        
    } catch (error) {
        console.error('Geçmiş yüklenemedi:', error);
        showStatus('Geçmiş yüklenemedi', 'danger');
    }
}

// Geçmiş item oluştur
function createHistoryItem(analysis, index) {
    const div = document.createElement('div');
    div.className = 'history-item';
    div.onclick = () => loadHistoryAnalysis(analysis);
    
    div.innerHTML = `
        <div class="d-flex justify-content-between align-items-start">
            <div>
                <h6 class="mb-2">
                    <i class="fas fa-chart-line me-2"></i>
                    Analiz #${index + 1}
                </h6>
                <p class="mb-1">
                    <strong>İşlenen:</strong> ${analysis.total_processed} | 
                    <strong>Başarılı:</strong> ${analysis.successful} |
                    <strong>Veri İçeren:</strong> ${analysis.total_metrics_with_data}
                </p>
            </div>
            <span class="timestamp-badge">${analysis.timestamp}</span>
        </div>
    `;
    
    return div;
}

// Geçmiş analizini yükle
function loadHistoryAnalysis(analysis) {
    currentAnalysis = analysis;
    displayResults(analysis);
    
    // Modal'ı kapat
    const modal = bootstrap.Modal.getInstance(document.getElementById('historyModal'));
    modal.hide();
    
    showStatus('Geçmiş analiz yüklendi', 'info');
}

// Raporu indir
function downloadReport() {
    if (!currentAnalysis) {
        showStatus('İndirilecek rapor bulunamadı', 'warning');
        return;
    }
    
    const content = `
Prometheus Metrik Analiz Raporu
===============================

Tarih: ${currentAnalysis.timestamp}
Toplam İşlenen: ${currentAnalysis.total_processed}
Başarılı: ${currentAnalysis.successful}
Başarısız: ${currentAnalysis.failed}
Veri İçeren Metrikler: ${currentAnalysis.total_metrics_with_data}

Analiz Sonucu:
==============
${stripHtml(currentAnalysis.analysis || 'Analiz bulunamadı')}

Örnek Metrikler:
================
${currentAnalysis.sample_metrics ? currentAnalysis.sample_metrics.join(', ') : 'Yok'}
`;
    
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `metrik_analizi_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showStatus('Rapor indirildi', 'success');
}

// HTML etiketlerini temizle
function stripHtml(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
}

// Durum mesajını göster
function showStatus(message, type) {
    const status = document.getElementById('status');
    const statusText = document.getElementById('statusText');
    
    status.className = `alert alert-${type} mb-0`;
    statusText.textContent = message;
    status.style.display = 'block';
    
    // 5 saniye sonra gizle (success veya info için)
    if (type === 'success' || type === 'info') {
        setTimeout(() => {
            status.style.display = 'none';
        }, 5000);
    }
}

// Bölümleri göster/gizle
function showProgressSection() {
    document.getElementById('progressSection').style.display = 'block';
}

function hideProgressSection() {
    document.getElementById('progressSection').style.display = 'none';
}

function showResultsSection() {
    document.getElementById('resultsSection').style.display = 'block';
}

function hideResultsSection() {
    document.getElementById('resultsSection').style.display = 'none';
}

function showMetricsSection() {
    document.getElementById('metricsSection').style.display = 'block';
}

function hideMetricsSection() {
    document.getElementById('metricsSection').style.display = 'none';
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl+Enter ile analiz başlat
    if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        if (!analysisInProgress) {
            startAnalysis();
        }
    }
    
    // Ctrl+H ile geçmişi aç
    if (e.ctrlKey && e.key === 'h') {
        e.preventDefault();
        showHistory();
    }
    
    // Ctrl+D ile raporu indir
    if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        downloadReport();
    }
});
