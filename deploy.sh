#!/bin/bash

# Остановить скрипт при ошибках
set -e

# Директория проекта
PROJECT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$PROJECT_DIR"

# Создание директории для логов
mkdir -p logs

echo "Обновление зависимостей серверной части..."
npm ci

echo "Билд и обновление зависимостей клиентской части..."
cd front
npm ci
npm run build
cd ..

# Проверка наличия ecosystem.config.js
if [ ! -f "ecosystem.config.js" ]; then
  echo "Создание файла конфигурации PM2..."
  cat > ecosystem.config.js << 'EOF'
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  apps: [
    {
      name: 'backend',
      script: 'server.js',
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: path.join(__dirname, 'logs/backend-error.log'),
      out_file: path.join(__dirname, 'logs/backend-out.log'),
      log_file: path.join(__dirname, 'logs/backend-combined.log'),
      time: true
    },
    {
      name: 'frontend',
      cwd: path.join(__dirname, 'front'),
      script: 'node_modules/.bin/vite',
      args: 'preview --port 5173 --host',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production'
      },
      error_file: path.join(__dirname, 'logs/frontend-error.log'),
      out_file: path.join(__dirname, 'logs/frontend-out.log'),
      log_file: path.join(__dirname, 'logs/frontend-combined.log'),
      time: true
    }
  ]
};
EOF
fi

# Проверка установки PM2
if ! command -v pm2 &> /dev/null; then
  echo "Установка PM2 глобально..."
  npm install -g pm2
fi

# Запуск через PM2
echo "Запуск приложения через PM2..."
pm2 delete all 2>/dev/null || true
pm2 start ecosystem.config.js

# Сохраняем конфигурацию PM2, чтобы она загружалась при перезагрузке сервера
pm2 save

echo "Настройка автозапуска PM2 при загрузке системы..."
pm2 startup

echo "Деплой успешно завершен!"
echo "Используйте следующие команды для управления приложением:"
echo "  pm2 status - показать статус всех процессов"
echo "  pm2 logs - просмотр логов в реальном времени"
echo "  pm2 restart all - перезапуск всех процессов"
echo "  pm2 stop all - остановка всех процессов"
echo "  pm2 delete all - удаление всех процессов из PM2"