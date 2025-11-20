// Микросервис для управления расходами
// Демонстрирует работу с ресурсами приложения через API

import { apiGet, apiPost, apiDelete } from '../utils/apiClient';
import { API_ENDPOINTS } from '../config/api';
import { cacheService, STORAGE_KEYS, removeFromStorage } from '../utils/storage';

/**
 * Получает список расходов пользователя
 * Использует кэширование для оптимизации производительности
 * @param {boolean} useCache - использовать ли кэш (по умолчанию true)
 * @returns {Promise<{data: Array, error: any}>}
 */
export const getExpenses = async (useCache = true) => {
  // Пытаемся загрузить из кэша, если включено кэширование
  if (useCache) {
    const cached = await cacheService.loadCache(STORAGE_KEYS.EXPENSES_CACHE);
    if (cached) {
      console.log('Loading expenses from cache');
      return { data: cached, error: null, fromCache: true };
    }
  }

  // Если кэша нет или он устарел, делаем запрос к API
  const result = await apiGet(API_ENDPOINTS.EXPENSES.LIST);

  // Сохраняем в кэш при успешном ответе
  if (result.data && !result.error) {
    await cacheService.saveCache(STORAGE_KEYS.EXPENSES_CACHE, result.data);
  }

  return { ...result, fromCache: false };
};

/**
 * Создает новый расход
 * @param {object} expenseData - данные расхода {amount, categoryId, note, currency}
 * @returns {Promise<{data: object, error: any}>}
 */
export const createExpense = async (expenseData) => {
  const result = await apiPost(API_ENDPOINTS.EXPENSES.CREATE, expenseData);

  // При успешном создании инвалидируем кэш, чтобы при следующем запросе
  // данные обновились с сервера
  if (result.data && !result.error) {
    await removeFromStorage(STORAGE_KEYS.EXPENSES_CACHE);
  }

  return result;
};

/**
 * Удаляет расход по ID
 * @param {string} expenseId - ID расхода
 * @returns {Promise<{data: any, error: any}>}
 */
export const deleteExpense = async (expenseId) => {
  const result = await apiDelete(API_ENDPOINTS.EXPENSES.DELETE(expenseId));

  // Инвалидируем кэш при успешном удалении
  if (!result.error) {
    await removeFromStorage(STORAGE_KEYS.EXPENSES_CACHE);
  }

  return result;
};

