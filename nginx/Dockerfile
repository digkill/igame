# Dockerfile для nginx (опционально, если нужна кастомная сборка)
FROM nginx:alpine

# Копируем конфигурацию
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Создаем директорию для логов
RUN mkdir -p /var/log/nginx

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]

