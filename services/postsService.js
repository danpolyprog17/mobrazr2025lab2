// Микросервис для работы с постами блога

import { apiGet, apiPost } from '../utils/apiClient';
import { API_ENDPOINTS } from '../config/api';
import { cacheService, STORAGE_KEYS, removeFromStorage } from '../utils/storage';

/**
 * Получает список постов
 * @param {boolean} useCache - использовать ли кэш
 * @returns {Promise<{data: {posts: Array}, error: any}>}
 */
export const getPosts = async (useCache = true) => {
  if (useCache) {
    const cached = await cacheService.loadCache(STORAGE_KEYS.POSTS_CACHE);
    if (cached) {
      console.log('Loading posts from cache');
      return { data: cached, error: null, fromCache: true };
    }
  }

  const result = await apiGet(API_ENDPOINTS.POSTS.LIST);

  if (result.data && !result.error) {
    await cacheService.saveCache(STORAGE_KEYS.POSTS_CACHE, result.data);
  }

  return { ...result, fromCache: false };
};

/**
 * Создает новый пост
 * @param {object} postData - данные поста {content, imageUrl?}
 * @returns {Promise<{data: {post: object}, error: any}>}
 */
export const createPost = async (postData) => {
  const result = await apiPost(API_ENDPOINTS.POSTS.CREATE, postData);

  if (result.data && !result.error) {
    await removeFromStorage(STORAGE_KEYS.POSTS_CACHE);
  }

  return result;
};

