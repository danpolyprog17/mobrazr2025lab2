// HTTP клиент для работы с API
// Централизованная обработка запросов, ошибок и авторизации

import { API_BASE_URL } from '../config/api';
import { loadFromStorage, STORAGE_KEYS } from './storage';

/**
 * Выполняет HTTP запрос к API
 * @param {string} endpoint - эндпоинт API
 * @param {object} options - опции запроса (method, body, headers и т.д.)
 * @returns {Promise<{data: any, error: any}>}
 */
export const apiRequest = async (endpoint, options = {}) => {
  const { method = 'GET', body, headers = {} } = options;

  // Формируем полный URL
  const url = `${API_BASE_URL}${endpoint}`;

  // Получаем токен авторизации из локального хранилища
  const token = await loadFromStorage(STORAGE_KEYS.AUTH_TOKEN);

  // Формируем заголовки запроса
  const requestHeaders = {
    'Content-Type': 'application/json',
    ...headers,
  };

  // Добавляем токен авторизации, если он есть
  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`;
  }

  // Для NextAuth нужно использовать cookies, но в мобильном приложении
  // мы будем использовать токен в заголовке или session cookie
  // В реальном приложении здесь может быть логика работы с cookies

  try {
    console.log(`[API] ${method} ${url}`);
    
    // Добавляем таймаут для запросов (30 секунд)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    console.log(`[API] Response status: ${response.status} ${response.statusText}`);

    // Проверяем, есть ли контент для парсинга
    const contentType = response.headers.get('content-type');
    const text = await response.text();
    
    let data;
    if (text && contentType && contentType.includes('application/json')) {
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error('[API] JSON parse error:', parseError, 'Response text:', text);
        return {
          data: null,
          error: {
            message: 'Invalid JSON response from server',
            status: response.status,
            originalError: parseError.message,
          },
        };
      }
    } else {
      // Если ответ не JSON, возвращаем текст или пустой объект
      data = text || {};
    }

    // Если статус не успешный, возвращаем ошибку
    if (!response.ok) {
      console.error(`[API] Error response:`, data);
      return {
        data: null,
        error: {
          message: data.error || data.message || 'Request failed',
          status: response.status,
        },
      };
    }

    console.log(`[API] Success:`, Array.isArray(data) ? `${data.length} items` : 'data received');
    return { data, error: null };
  } catch (error) {
    console.error('[API] Request error:', error);
    console.error('[API] URL was:', url);
    
    // Более понятные сообщения об ошибках
    let errorMessage = 'Network error';
    if (error.name === 'AbortError') {
      errorMessage = 'Request timeout. Сервер не отвечает слишком долго.';
    } else if (error.message === 'Network request failed') {
      errorMessage = `Не удалось подключиться к серверу. Убедись, что API сервер запущен и доступен по адресу ${API_BASE_URL}`;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return {
      data: null,
      error: {
        message: errorMessage,
        status: 0,
        originalError: error.message || error.name,
      },
    };
  }
};

/**
 * GET запрос
 */
export const apiGet = (endpoint) => apiRequest(endpoint, { method: 'GET' });

/**
 * POST запрос
 */
export const apiPost = (endpoint, body) =>
  apiRequest(endpoint, { method: 'POST', body });

/**
 * PUT запрос
 */
export const apiPut = (endpoint, body) =>
  apiRequest(endpoint, { method: 'PUT', body });

/**
 * DELETE запрос
 */
export const apiDelete = (endpoint) =>
  apiRequest(endpoint, { method: 'DELETE' });

