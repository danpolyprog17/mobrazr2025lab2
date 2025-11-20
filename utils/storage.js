// Утилита для работы с локальным хранилищем (AsyncStorage)
// Демонстрирует управление ресурсами приложения через локальное хранилище

import AsyncStorage from '@react-native-async-storage/async-storage';

// Ключи для хранения данных
const STORAGE_KEYS = {
  AUTH_TOKEN: '@auth_token',
  USER_DATA: '@user_data',
  EXPENSES_CACHE: '@expenses_cache',
  CATEGORIES_CACHE: '@categories_cache',
  LEADERBOARD_CACHE: '@leaderboard_cache',
  POSTS_CACHE: '@posts_cache',
  CACHE_TIMESTAMP: '@cache_timestamp',
};

/**
 * Сохраняет данные в локальное хранилище
 * @param {string} key - ключ для хранения
 * @param {any} value - значение для сохранения (будет сериализовано в JSON)
 */
export const saveToStorage = async (key, value) => {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
    return true;
  } catch (error) {
    console.error('Error saving to storage:', error);
    return false;
  }
};

/**
 * Загружает данные из локального хранилища
 * @param {string} key - ключ для загрузки
 * @returns {Promise<any|null>} - десериализованное значение или null
 */
export const loadFromStorage = async (key) => {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (error) {
    console.error('Error loading from storage:', error);
    return null;
  }
};

/**
 * Удаляет данные из локального хранилища
 * @param {string} key - ключ для удаления
 */
export const removeFromStorage = async (key) => {
  try {
    await AsyncStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error('Error removing from storage:', error);
    return false;
  }
};

/**
 * Очищает все данные из хранилища
 */
export const clearStorage = async () => {
  try {
    await AsyncStorage.clear();
    return true;
  } catch (error) {
    console.error('Error clearing storage:', error);
    return false;
  }
};

// Специализированные функции для работы с кэшем
export const cacheService = {
  // Сохраняет кэш данных с временной меткой
  saveCache: async (key, data) => {
    const cacheData = {
      data,
      timestamp: Date.now(),
    };
    return saveToStorage(key, cacheData);
  },

  // Загружает кэш, если он не устарел
  loadCache: async (key, maxAge = 5 * 60 * 1000) => {
    // maxAge по умолчанию 5 минут
    const cached = await loadFromStorage(key);
    if (!cached || !cached.timestamp) return null;

    const age = Date.now() - cached.timestamp;
    if (age > maxAge) {
      // Кэш устарел, удаляем его
      await removeFromStorage(key);
      return null;
    }

    return cached.data;
  },
};

// Экспортируем ключи для использования в других модулях
export { STORAGE_KEYS };





