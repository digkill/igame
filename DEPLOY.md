# Инструкция по развертыванию в продакшене

## Требования

- Docker и Docker Compose
- Минимум 1GB RAM (для статического экспорта требуется меньше ресурсов)
- Порты 80 и 443 должны быть свободны

## Быстрый старт

### 1. Локальная сборка (для проверки)

```bash
# Сборка статических файлов
yarn build

# Проверка результата
ls out/index.html  # Должен существовать
```

### 2. Сборка и запуск с Docker

```bash
# Сборка и запуск
docker-compose up -d --build

# Просмотр логов
docker-compose logs -f

# Остановка
docker-compose down
```

### 3. Проверка работоспособности

```bash
# Проверка health check
curl http://localhost/health

# Проверка приложения
curl http://localhost

# Откройте в браузере
# http://localhost
```

## Структура проекта

```
.
├── src/                 # Исходный код Next.js приложения
├── out/                 # Статические HTML файлы (создается после yarn build)
├── nginx/               # Nginx конфигурация
│   ├── nginx.conf       # Основной конфиг nginx для статики
│   └── logs/            # Логи nginx
├── Dockerfile           # Docker образ (собирает статику и настраивает nginx)
├── docker-compose.yml   # Оркестрация сервисов
└── DEPLOY.md           # Эта инструкция
```

## Как это работает

1. **Сборка**: `yarn build` создает статические HTML файлы в папке `out/`
2. **Docker**: Dockerfile копирует папку `out/` в nginx контейнер
3. **Nginx**: Раздает статические файлы напрямую (без Node.js сервера)

## Конфигурация

### Next.js (next.config.ts)

```typescript
output: 'export', // Статический экспорт для генерации HTML файлов
images: {
  unoptimized: true, // Требуется для статического экспорта
},
trailingSlash: true, // Добавляет слэш в конце URL
```

### Nginx

Основной конфиг находится в `nginx/nginx.conf`. Настройки включают:

- Раздачу статических файлов из `/usr/share/nginx/html`
- Кэширование статических ресурсов (1 год)
- Gzip сжатие
- Rate limiting для защиты от DDoS
- Health check endpoint
- Правильную обработку HTML файлов

### Переменные окружения

Для статического экспорта переменные окружения не требуются, так как все собирается на этапе build.

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
    
    root /usr/share/nginx/html;
    index index.html;
    
    # ... остальная конфигурация
}
```

3. Обновите `docker-compose.yml`:

```yaml
nginx:
  volumes:
    - ./nginx/nginx.conf:/etc/nginx/conf.d/default.conf:ro
    - ./nginx/ssl:/etc/nginx/ssl:ro
    - ./nginx/logs:/var/log/nginx
```

## Мониторинг и логи

### Просмотр логов

```bash
# Все сервисы
docker-compose logs -f

# Только nginx
docker-compose logs -f nginx
```

### Логи nginx

Логи сохраняются в `nginx/logs/`:
- `access.log` - логи доступа
- `error.log` - ошибки

## Обновление приложения

```bash
# 1. Остановка
docker-compose down

# 2. Пересборка (создаст новые статические файлы)
docker-compose build --no-cache

# 3. Запуск
docker-compose up -d
```

Или локально:

```bash
# 1. Сборка статики
yarn build

# 2. Пересборка Docker образа
docker-compose build --no-cache

# 3. Перезапуск
docker-compose up -d
```

## Производительность

### Преимущества статического экспорта

- ✅ Быстрая загрузка (нет серверного рендеринга)
- ✅ Низкое потребление ресурсов (только nginx)
- ✅ Легко кэшировать (CDN friendly)
- ✅ Высокая безопасность (нет Node.js сервера)
- ✅ Простое масштабирование (любое количество nginx инстансов)

### Оптимизация nginx

В `nginx/nginx.conf` уже настроено:
- Кэширование статических файлов (1 год)
- Gzip сжатие
- Rate limiting

## Развертывание без Docker

Если вы хотите развернуть без Docker:

```bash
# 1. Сборка
yarn build

# 2. Копирование файлов на сервер
scp -r out/* user@server:/var/www/html/

# 3. Настройка nginx на сервере
# Скопируйте nginx/nginx.conf в /etc/nginx/sites-available/
```

## Troubleshooting

### index.html не создается

Проверьте `next.config.ts`:
```typescript
output: 'export'  // Должно быть установлено
```

Запустите сборку:
```bash
yarn build
ls out/index.html  # Должен существовать
```

### Nginx не находит файлы

Проверьте, что папка `out` скопирована в контейнер:
```bash
docker-compose exec nginx ls -la /usr/share/nginx/html/
```

### Проблемы с маршрутизацией

Убедитесь, что в `nginx.conf` есть:
```nginx
try_files $uri $uri.html $uri/ /index.html;
```

### Проблемы с изображениями

В `next.config.ts` должно быть:
```typescript
images: {
  unoptimized: true,
}
```

## Безопасность

- Rate limiting включен по умолчанию
- Блокировка доступа к скрытым файлам
- Блокировка доступа к исходным файлам (.ts, .tsx, .jsx)
- Health check endpoint для мониторинга
- Статические файлы (нет серверного кода)

## Поддержка

При возникновении проблем проверьте:
1. Логи контейнеров: `docker-compose logs`
2. Доступность портов: `netstat -tuln | grep 80`
3. Конфигурацию nginx: `docker-compose exec nginx nginx -t`
4. Наличие файлов: `docker-compose exec nginx ls -la /usr/share/nginx/html/`
