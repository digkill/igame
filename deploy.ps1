# PowerShell скрипт для развертывания приложения

Write-Host "🚀 Запуск развертывания casino-ui..." -ForegroundColor Cyan

# Проверка наличия Docker
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker не установлен. Установите Docker и повторите попытку." -ForegroundColor Red
    exit 1
}

if (-not (Get-Command docker-compose -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker Compose не установлен. Установите Docker Compose и повторите попытку." -ForegroundColor Red
    exit 1
}

# Создание директории для логов если её нет
if (-not (Test-Path "nginx\logs")) {
    New-Item -ItemType Directory -Path "nginx\logs" -Force | Out-Null
}

# Остановка существующих контейнеров
Write-Host "🛑 Остановка существующих контейнеров..." -ForegroundColor Yellow
docker-compose down

# Сборка и запуск
Write-Host "🔨 Сборка образов..." -ForegroundColor Yellow
docker-compose build --no-cache

Write-Host "▶️  Запуск контейнеров..." -ForegroundColor Yellow
docker-compose up -d

# Ожидание готовности
Write-Host "⏳ Ожидание готовности сервисов..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Проверка статуса
Write-Host "📊 Статус контейнеров:" -ForegroundColor Cyan
docker-compose ps

# Проверка health check
Write-Host "🏥 Проверка health check..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost/health" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Приложение успешно запущено!" -ForegroundColor Green
        Write-Host "🌐 Откройте http://localhost в браузере" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Health check не прошел. Проверьте логи:" -ForegroundColor Yellow
    Write-Host "   docker-compose logs" -ForegroundColor Yellow
}

