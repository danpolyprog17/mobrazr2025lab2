# Решение проблемы с подключением к API

## Проблема
Expo Go не может подключиться к API серверу по адресу `192.168.0.20:3001` или `10.0.2.2:3001`.

## Решение: Использовать ngrok туннель

### Шаг 1: Установите ngrok

```bash
# Скачайте ngrok с https://ngrok.com/download
# Или установите через пакетный менеджер:
# Arch Linux:
yay -S ngrok
# или
sudo pacman -S ngrok

# Ubuntu/Debian:
curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
sudo apt update && sudo apt install ngrok
```

### Шаг 2: Зарегистрируйтесь на ngrok.com (бесплатно)

1. Перейдите на https://ngrok.com
2. Зарегистрируйтесь
3. Получите authtoken из dashboard

### Шаг 3: Настройте ngrok

```bash
ngrok config add-authtoken YOUR_AUTH_TOKEN
```

### Шаг 4: Запустите ngrok туннель для API сервера

В **новом терминале** (пока API сервер работает):

```bash
ngrok http 3001
```

Вы увидите что-то вроде:
```
Forwarding  https://xxxx-xx-xx-xx-xx.ngrok-free.app -> http://localhost:3001
```

Скопируйте HTTPS URL (например: `https://xxxx-xx-xx-xx-xx.ngrok-free.app`)

### Шаг 5: Обновите конфигурацию API

Откройте `config/api.js` и измените:

```javascript
if (Platform.OS === 'android') {
  return 'https://xxxx-xx-xx-xx-xx.ngrok-free.app'; // Ваш ngrok URL
}
```

### Шаг 6: Перезапустите приложение

В терминале с Expo нажмите `r` для перезагрузки.

---

## Альтернативное решение: Использовать Expo tunnel

Если не хотите использовать ngrok, можно попробовать запустить Expo с туннелем:

```bash
cd "/home/daniel/Documents/MobDev/2 лаба/lab3"
npx expo start --tunnel
```

Но это может не помочь с API сервером, так как туннель только для Expo, а не для API.

---

## Временное решение: Использовать веб-версию

Пока настраиваете туннель, можно протестировать приложение в веб-браузере:

```bash
# В терминале с Expo нажмите 'w'
# Или запустите:
npm run web
```

Веб-версия будет использовать `http://localhost:3001`, что должно работать.


