#!/bin/bash

echo "Updating React application..."

# 1. React uygulamasını yeniden build et
echo "Building React app..."
npm run build

# 2. Build dizininin izinlerini düzelt
echo "Setting permissions..."
chmod -R 755 build/
chmod +x /home
chmod +x /home/eren
chmod +x /home/eren/Desktop
chmod +x /home/eren/Desktop/TodolistFullStack
chmod +x /home/eren/Desktop/TodolistFullStack/react_frontend

# 3. Nginx'i reload et (graceful restart)
echo "Reloading nginx..."
sudo nginx -s reload

echo "Application updated successfully!"
echo "Visit http://localhost:3000 to see changes"
