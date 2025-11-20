// Микросервис для управления категориями расходов

import { apiGet, apiPost } from '../utils/apiClient';
import { API_ENDPOINTS } from '../config/api';
import { cacheService, STORAGE_KEYS, removeFromStorage } from '../utils/storage';

/**
 * Получает список категорий пользователя
 * @param {boolean} useCache - использовать ли кэш
 * @returns {Promise<{data: Array, error: any}>}
 */
export const getCategories = async (useCache = true) => {
  if (useCache) {
    const cached = await cacheService.loadCache(STORAGE_KEYS.CATEGORIES_CACHE);
    if (cached) {
      console.log('Loading categories from cache');
      return { data: cached, error: null, fromCache: true };
    }
  }

  const result = await apiGet(API_ENDPOINTS.CATEGORIES.LIST);

  if (result.data && !result.error) {
    await cacheService.saveCache(STORAGE_KEYS.CATEGORIES_CACHE, result.data);
  }

  return { ...result, fromCache: false };
};

/**
 * Создает новую категорию
 * @param {object} categoryData - данные категории {name, color}
 * @returns {Promise<{data: object, error: any}>}
 */
export const createCategory = async (categoryData) => {
  const result = await apiPost(API_ENDPOINTS.CATEGORIES.CREATE, categoryData);

  if (result.data && !result.error) {
    await removeFromStorage(STORAGE_KEYS.CATEGORIES_CACHE);
  }

  return result;
};

