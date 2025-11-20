// Конфигурация API для микросервисной архитектуры
// Базовый URL можно настроить в зависимости от окружения (dev/prod)

// ВАЖНО: 
// - Для Android ЭМУЛЯТОРА используйте: 'http://10.0.2.2:3001'
// - Для реального Android/iOS устройства используйте IP адрес компьютера: 'http://192.168.0.20:3001'
// - Для веб-версии используйте: 'http://localhost:3001'
// 
// Чтобы узнать IP адрес:
// - Linux/Mac: ip addr show | grep "inet " | grep -v 127.0.0.1
// - Windows: ipconfig

import { Platform } from 'react-native';

// Определяем базовый URL в зависимости от платформы
const getApiBaseUrl = () => {
  if (!__DEV__) {
    return 'https://your-app.vercel.app'; // Продакшн URL
  }

  // Для веб-версии
  if (Platform.OS === 'web') {
    return 'http://localhost:3001';
  }

  // Для Android эмулятора
  if (Platform.OS === 'android') {
    // Используем ngrok туннель для доступа к API серверу
    // Это решает проблему с подключением из Expo Go
    return 'https://portliest-elias-uninterestingly.ngrok-free.dev';
  }

  // Для iOS симулятора можно использовать localhost
  if (Platform.OS === 'ios') {
    return 'http://localhost:3001'; // iOS симулятор
    // Для реального iOS устройства используйте IP: 'http://192.168.0.20:3001'
  }

  // По умолчанию
  return 'http://192.168.0.20:3001';
};

export const API_BASE_URL = getApiBaseUrl();

// Логируем используемый URL для отладки
if (__DEV__) {
  console.log(`[API Config] Platform: ${Platform.OS}, Base URL: ${API_BASE_URL}`);
}

// Эндпоинты микросервисов
export const API_ENDPOINTS = {
  // Сервис аутентификации
  AUTH: {
    LOGIN: '/api/auth/signin',
    REGISTER: '/api/auth/register',
    SESSION: '/api/auth/session',
  },
  // Сервис расходов
  EXPENSES: {
    LIST: '/api/expenses',
    CREATE: '/api/expenses',
    DELETE: (id) => `/api/expenses/${id}`,
  },
  // Сервис категорий
  CATEGORIES: {
    LIST: '/api/categories',
    CREATE: '/api/categories',
  },
  // Сервис лидерборда
  LEADERBOARD: {
    LIST: '/api/leaderboard',
  },
  // Сервис блога (посты)
  POSTS: {
    LIST: '/api/posts',
    CREATE: '/api/posts',
    LIKE: (id) => `/api/posts/${id}/like`,
    COMMENTS: (id) => `/api/posts/${id}/comments`,
  },
  // Сервис профиля
  PROFILE: {
    GET: '/api/profile',
    UPDATE: '/api/profile',
  },
};

