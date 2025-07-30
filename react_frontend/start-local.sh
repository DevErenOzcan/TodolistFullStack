#!/bin/bash

# React uygulamasının build edildiğinden emin olun
echo "Checking if React app is built..."
if [ ! -d "build" ]; then
    echo "Build directory not found. Building React app..."
    npm run build
fi

# Build dizininin ve dosyalarının izinlerini düzelt
echo "Setting proper permissions for build directory..."
# Tüm parent dizinlere execute izni ver
chmod +x /home
chmod +x /home/eren
chmod +x /home/eren/Desktop
chmod +x /home/eren/Desktop/TodolistFullStack
chmod +x /home/eren/Desktop/TodolistFullStack/react_frontend

# Build dizinine tam erişim ver
chmod -R 755 build/
chmod 755 $(pwd)
chmod 755 $(dirname $(pwd))

# Nginx kurulu mu kontrol et
if ! command -v nginx &> /dev/null; then
    echo "Nginx is not installed. Please install nginx first:"
    echo "sudo apt update && sudo apt install nginx"
    exit 1
fi

# Backend'in çalışıp çalışmadığını kontrol et
echo "Checking if backend is running on localhost:8080..."
if ! curl -s http://localhost:8080/api > /dev/null; then
    echo "Warning: Backend is not responding on localhost:8080"
    echo "Make sure your Go backend is running before starting nginx"
fi

# Nginx konfigürasyonunu test et
echo "Testing nginx configuration..."
sudo nginx -t -c $(pwd)/nginx-local.conf

if [ $? -eq 0 ]; then
    echo "Starting nginx with local configuration..."
    echo "Your React app will be available at: http://localhost:3000"
    echo "Press Ctrl+C to stop"

    # Mevcut nginx processlerini durdur
    sudo pkill nginx 2>/dev/null || true

    # Nginx'i local konfigürasyon ile başlat
    sudo nginx -c $(pwd)/nginx-local.conf -g 'daemon off;'
else
    echo "Nginx configuration test failed!"
    exit 1
fi
