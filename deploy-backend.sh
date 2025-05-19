cd ~/server/projectStroymaster/
cat > deploy-backend.sh << 'EOF'
#!/bin/bash

# Остановить скрипт при ошибках
set -e

# Директория проекта
cd ~/server/projectStroymaster/

# Создание директории для логов
mkdir -p logs

echo "Обновление зависимостей серверной части..."
npm ci

# Запуск через PM2
echo "Запуск бэкенда через PM2..."
pm2 delete stroymasterBackend 2>/dev/null || true
pm2 start ecosystem.config.js

# Сохраняем конфигурацию PM2
pm2 save

echo "Бэкенд успешно запущен!"
EOF

chmod +x deploy-backend.sh