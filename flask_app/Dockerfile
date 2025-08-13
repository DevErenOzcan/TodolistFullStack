# Python 3.11 slim image kullan
FROM python:3.11-slim

# Çalışma dizinini ayarla
WORKDIR /app

# Sistem bağımlılıklarını yükle
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Requirements dosyasını kopyala ve bağımlılıkları yükle
COPY requirements.txt .
RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# Uygulama dosyalarını kopyala
COPY . .

# Flask uygulamasının çalışacağı portu belirt
EXPOSE 5000

# Uygulamayı çalıştır (önce development modunda flask kullan, sonra gunicorn'a geçeriz)
CMD ["python", "app.py"]
