# Aşama 1: Build React uygulaması
FROM node:18 AS builder

# Çalışma dizinini ayarla
WORKDIR /app

# package.json ve package-lock.json dosyalarını kopyala
COPY package*.json ./

# Bağımlılıkları yükle
RUN npm install

# Uygulama kaynaklarını kopyala
COPY . .

# React uygulamasını production için build et
RUN npm run build

# Aşama 2: Build edilmiş dosyaları nginx ile servis et
FROM nginx:alpine

# envsubst için gettext paketi yükle
RUN apk add --no-cache gettext

# Nginx konfigürasyon template'ini kopyala
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Startup script'ini kopyala ve executable yap
COPY start.sh /start.sh
RUN chmod +x /start.sh

# Build edilmiş dosyaları nginx'in public dizinine kopyala
COPY --from=builder /app/build /usr/share/nginx/html

# 80 portunu expose et
EXPOSE 80

# Startup script'i ile nginx'i başlat
CMD ["/start.sh"]
