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

# Güncellenmiş Nginx konfigürasyonunu kopyala
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Build edilmiş dosyaları nginx'in public dizinine kopyala
COPY --from=builder /app/build /usr/share/nginx/html

# 80 portunu expose et
EXPOSE 80

# Nginx'i doğrudan ve ön planda başlat (container için standart yöntem)
CMD ["nginx", "-g", "daemon off;"]