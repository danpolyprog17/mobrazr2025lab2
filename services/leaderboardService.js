// Микросервис для работы с лидербордом

import { apiGet } from '../utils/apiClient';
import { API_ENDPOINTS } from '../config/api';
import { cacheService, STORAGE_KEYS } from '../utils/storage';

/**
 * Получает данные лидерборда
 * @param {boolean} useCache - использовать ли кэш
 * @returns {Promise<{data: Array, error: any}>}
 */
export const getLeaderboard = async (useCache = true) => {
  if (useCache) {
    const cached = await cacheService.loadCache(STORAGE_KEYS.LEADERBOARD_CACHE);
    if (cached) {
      console.log('Loading leaderboard from cache');
      return { data: cached, error: null, fromCache: true };
    }
  }

  const result = await apiGet(API_ENDPOINTS.LEADERBOARD.LIST);

  if (result.data && !result.error) {
    await cacheService.saveCache(STORAGE_KEYS.LEADERBOARD_CACHE, result.data);
  }

  return { ...result, fromCache: false };
};





