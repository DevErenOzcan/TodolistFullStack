# Python 3.11 slim image kullan
FROM python:3.11-slim as builder

# Geçici build bağımlılıkları
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Requirements'ı kopyala ve wheel'leri build et
COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Final stage - sadece çalışma zamanı
FROM python:3.11-slim

# Non-root user oluştur
RUN groupadd -r flaskuser && useradd -r -g flaskuser flaskuser

# Çalışma dizinini ayarla
WORKDIR /app

# Build stage'den Python paketlerini kopyala
COPY --from=builder /root/.local /home/flaskuser/.local

# Uygulama dosyalarını kopyala
COPY . .

# Gereksiz dosyaları temizle
RUN rm -rf __pycache__ *.pyc *.pyo \
    && find . -name "*.pyc" -delete \
    && find . -name "__pycache__" -delete

# Kullanıcı ve izinleri ayarla
RUN chown -R flaskuser:flaskuser /app
USER flaskuser

# PATH'e local bin ekle
ENV PATH=/home/flaskuser/.local/bin:$PATH

# Flask uygulamasının çalışacağı portu belirt
EXPOSE 5000

# Healthcheck ekle
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:5000/')" || exit 1

# Uygulamayı çalıştır
CMD ["python", "app.py"]
