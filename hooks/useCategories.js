// Кастомный хук для работы с категориями
// Демонстрирует использование хуков для управления ресурсами

import { useState, useEffect, useCallback } from 'react';
import { getCategories, createCategory } from '../services/categoriesService';

/**
 * Хук для управления категориями расходов
 * @param {boolean} autoLoad - автоматически загружать данные
 */
export const useCategories = (autoLoad = true) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fromCache, setFromCache] = useState(false);

  const loadCategories = useCallback(async (useCache = true) => {
    setLoading(true);
    setError(null);

    try {
      const result = await getCategories(useCache);

      if (result.error) {
        setError(result.error.message || 'Failed to load categories');
        setCategories([]);
      } else {
        setCategories(result.data || []);
        setFromCache(result.fromCache || false);
      }
    } catch (err) {
      setError(err.message || 'Unknown error');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const addCategory = useCallback(async (categoryData) => {
    setLoading(true);
    setError(null);

    try {
      const result = await createCategory(categoryData);

      if (result.error) {
        setError(result.error.message || 'Failed to create category');
        return { success: false, error: result.error };
      }

      await loadCategories(false);

      return { success: true, data: result.data };
    } catch (err) {
      setError(err.message || 'Unknown error');
      return { success: false, error: { message: err.message } };
    } finally {
      setLoading(false);
    }
  }, [loadCategories]);

  useEffect(() => {
    if (autoLoad) {
      loadCategories();
    }
  }, [autoLoad, loadCategories]);

  return {
    categories,
    loading,
    error,
    fromCache,
    loadCategories,
    addCategory,
  };
};





