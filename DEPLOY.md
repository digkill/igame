# Инструкция по развертыванию в продакшене

## Требования

- Docker и Docker Compose
- Минимум 2GB RAM
- Порты 80 и 443 должны быть свободны

## Быстрый старт

### 1. Сборка и запуск

```bash
# Сборка и запуск всех сервисов
docker-compose up -d --build

# Просмотр логов
docker-compose logs -f

# Остановка
docker-compose down
```

### 2. Проверка работоспособности

```bash
# Проверка health check
curl http://localhost/health

# Проверка приложения
curl http://localhost
```

## Структура проекта

```
.
├── casino-ui/          # Next.js приложение
│   ├── Dockerfile      # Docker образ для приложения
│   └── .dockerignore   # Исключения для Docker
├── nginx/              # Nginx конфигурация
│   ├── nginx.conf      # Основной конфиг nginx
│   └── Dockerfile      # Опциональный Dockerfile для nginx
├── docker-compose.yml  # Оркестрация сервисов
└── DEPLOY.md          # Эта инструкция
```

## Конфигурация

### Nginx

Основной конфиг находится в `nginx/nginx.conf`. Настройки включают:

- Проксирование запросов к Next.js (порт 3000)
- Кэширование статических файлов
- Gzip сжатие
- Rate limiting для защиты от DDoS
- Health check endpoint

### Переменные окружения

Для настройки приложения создайте файл `.env` в директории `casino-ui/`:

```env
NODE_ENV=production
PORT=3000
```

### Изменение портов

Чтобы изменить порты, отредактируйте `docker-compose.yml`:

```yaml
nginx:
  ports:
    - "8080:80"  # Внешний порт:внутренний порт
```

## SSL/HTTPS

Для включения HTTPS:

1. Поместите SSL сертификаты в `nginx/ssl/`:
   - `cert.pem` - сертификат
   - `key.pem` - приватный ключ

2. Обновите `nginx/nginx.conf`, добавив блок для HTTPS:

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    
    # ... остальная конфигурация
}
```

3. Обновите `docker-compose.yml`:

```yaml
nginx:
  volumes:
    - ./nginx/nginx.conf:/etc/nginx/conf.d/default.conf:ro
    - ./nginx/ssl:/etc/nginx/ssl:ro
```

## Мониторинг и логи

### Просмотр логов

```bash
# Все сервисы
docker-compose logs -f

# Только nginx
docker-compose logs -f nginx

# Только приложение
docker-compose logs -f app
```

### Логи nginx

Логи сохраняются в `nginx/logs/`:
- `access.log` - логи доступа
- `error.log` - ошибки

## Обновление приложения

```bash
# Остановка
docker-compose down

# Пересборка
docker-compose build --no-cache

# Запуск
docker-compose up -d
```

## Производительность

### Оптимизация nginx

В `nginx/nginx.conf` уже настроено:
- Кэширование статических файлов
- Gzip сжатие
- Keepalive соединения
- Rate limiting

### Масштабирование

Для масштабирования приложения обновите `docker-compose.yml`:

```yaml
app:
  deploy:
    replicas: 3  # Количество экземпляров
```

И обновите upstream в `nginx/nginx.conf`:

```nginx
upstream nextjs_backend {
    server app:3000;
    server app:3000;
    server app:3000;
    keepalive 64;
}
```

## Troubleshooting

### Приложение не запускается

```bash
# Проверка статуса контейнеров
docker-compose ps

# Проверка логов
docker-compose logs app

# Проверка портов
netstat -tuln | grep 80
```

### Nginx не проксирует запросы

```bash
# Проверка конфигурации nginx
docker-compose exec nginx nginx -t

# Перезагрузка nginx
docker-compose exec nginx nginx -s reload
```

### Проблемы с памятью

Увеличьте лимиты в `docker-compose.yml`:

```yaml
app:
  deploy:
    resources:
      limits:
        memory: 1G
      reservations:
        memory: 512M
```

## Безопасность

- Rate limiting включен по умолчанию
- Блокировка доступа к скрытым файлам
- Health check endpoint для мониторинга
- Непривилегированный пользователь в контейнере

## Поддержка

При возникновении проблем проверьте:
1. Логи контейнеров
2. Доступность портов
3. Конфигурацию nginx
4. Переменные окружения

