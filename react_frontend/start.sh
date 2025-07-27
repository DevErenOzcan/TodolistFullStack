#!/bin/sh

# Environment variable kontrolü
if [ -z "$REACT_APP_API_BASE_URL" ]; then
    echo "REACT_APP_API_BASE_URL environment variable is not set!"
    exit 1
fi

echo "Setting up nginx with backend URL: $REACT_APP_API_BASE_URL"

# Environment variable'ı nginx konfigürasyonuna inject et
envsubst '$REACT_APP_API_BASE_URL' < /etc/nginx/conf.d/default.conf > /etc/nginx/conf.d/default.conf.tmp && mv /etc/nginx/conf.d/default.conf.tmp /etc/nginx/conf.d/default.conf

# Nginx'i başlat
nginx -g 'daemon off;'
