// Микросервис для работы с профилем пользователя

import { apiGet, apiPut } from '../utils/apiClient';
import { API_ENDPOINTS } from '../config/api';
import { saveToStorage, loadFromStorage, STORAGE_KEYS } from '../utils/storage';

/**
 * Получает данные профиля пользователя
 * @returns {Promise<{data: object, error: any}>}
 */
export const getProfile = async () => {
  // Сначала проверяем локальное хранилище
  const cached = await loadFromStorage(STORAGE_KEYS.USER_DATA);
  if (cached) {
    console.log('Loading profile from local storage');
    return { data: cached, error: null, fromCache: true };
  }

  const result = await apiGet(API_ENDPOINTS.PROFILE.GET);

  // Сохраняем в локальное хранилище при успешном ответе
  if (result.data && !result.error) {
    await saveToStorage(STORAGE_KEYS.USER_DATA, result.data);
  }

  return { ...result, fromCache: false };
};

/**
 * Обновляет данные профиля
 * @param {object} profileData - данные для обновления {name?, image?, theme?}
 * @returns {Promise<{data: object, error: any}>}
 */
export const updateProfile = async (profileData) => {
  const result = await apiPut(API_ENDPOINTS.PROFILE.UPDATE, profileData);

  // Обновляем локальное хранилище при успешном обновлении
  if (result.data && result.data.user && !result.error) {
    await saveToStorage(STORAGE_KEYS.USER_DATA, result.data.user);
  }

  return result;
};





