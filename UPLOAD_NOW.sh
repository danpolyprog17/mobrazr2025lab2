#!/bin/bash
# Скрипт для быстрой загрузки на GitHub
# Использование: ./UPLOAD_NOW.sh YOUR_USERNAME REPO_NAME

if [ -z "$1" ] || [ -z "$2" ]; then
    echo "Использование: ./UPLOAD_NOW.sh YOUR_USERNAME REPO_NAME"
    echo "Пример: ./UPLOAD_NOW.sh daniel mobdev-lab3"
    exit 1
fi

USERNAME=$1
REPO_NAME=$2

echo "Добавляю remote репозиторий..."
git remote add origin https://github.com/$USERNAME/$REPO_NAME.git 2>/dev/null || git remote set-url origin https://github.com/$USERNAME/$REPO_NAME.git

echo "Отправляю код на GitHub..."
git push -u origin main

echo ""
echo "✅ Готово! Репозиторий доступен по адресу:"
echo "   https://github.com/$USERNAME/$REPO_NAME"
echo ""
echo "Не забудьте обновить ссылку в REPORT.md!"

