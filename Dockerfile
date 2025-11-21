# Multi-stage build для статического Next.js приложения

# Стадия 1: Сборка приложения
FROM node:20-alpine AS builder

WORKDIR /app

# Копируем файлы зависимостей
COPY package*.json ./
COPY yarn.lock* ./

# Устанавливаем зависимости
RUN npm ci --only=production=false || yarn install --frozen-lockfile

# Копируем исходный код
COPY . .

# Собираем приложение (создаст папку out с HTML файлами)
RUN npm run build || yarn build

# Стадия 2: Production образ с nginx
FROM nginx:alpine

# Копируем статические файлы из сборки
COPY --from=builder /app/out /usr/share/nginx/html

# Копируем конфигурацию nginx
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Создаем директорию для логов
RUN mkdir -p /var/log/nginx

# Открываем порт
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
