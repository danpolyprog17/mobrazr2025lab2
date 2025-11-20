// Кастомный хук для работы с расходами
// Демонстрирует использование useState и useEffect для управления состоянием и жизненным циклом

import { useState, useEffect, useCallback } from 'react';
import { getExpenses, createExpense, deleteExpense } from '../services/expensesService';

/**
 * Хук для управления расходами
 * Использует useState для хранения состояния и useEffect для загрузки данных
 * @param {boolean} autoLoad - автоматически загружать данные при монтировании (по умолчанию true)
 * @returns {object} - состояние и функции для работы с расходами
 */
export const useExpenses = (autoLoad = true) => {
  // Состояние для хранения списка расходов
  const [expenses, setExpenses] = useState([]);
  // Состояние загрузки данных
  const [loading, setLoading] = useState(false);
  // Состояние ошибки
  const [error, setError] = useState(null);
  // Флаг, показывающий, загружены ли данные из кэша
  const [fromCache, setFromCache] = useState(false);

  /**
   * Функция для загрузки расходов
   * Использует useCallback для мемоизации функции и предотвращения лишних ререндеров
   */
  const loadExpenses = useCallback(async (useCache = true) => {
    setLoading(true);
    setError(null);

    try {
      const result = await getExpenses(useCache);

      if (result.error) {
        setError(result.error.message || 'Failed to load expenses');
        setExpenses([]);
      } else {
        setExpenses(result.data || []);
        setFromCache(result.fromCache || false);
      }
    } catch (err) {
      setError(err.message || 'Unknown error');
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Функция для добавления нового расхода
   */
  const addExpense = useCallback(async (expenseData) => {
    setLoading(true);
    setError(null);

    try {
      const result = await createExpense(expenseData);

      if (result.error) {
        setError(result.error.message || 'Failed to create expense');
        return { success: false, error: result.error };
      }

      // После успешного создания перезагружаем список расходов
      await loadExpenses(false); // false = не использовать кэш, получить свежие данные

      return { success: true, data: result.data };
    } catch (err) {
      setError(err.message || 'Unknown error');
      return { success: false, error: { message: err.message } };
    } finally {
      setLoading(false);
    }
  }, [loadExpenses]);

  /**
   * Функция для удаления расхода
   */
  const removeExpense = useCallback(async (expenseId) => {
    setLoading(true);
    setError(null);

    try {
      const result = await deleteExpense(expenseId);

      if (result.error) {
        setError(result.error.message || 'Failed to delete expense');
        return { success: false, error: result.error };
      }

      // Обновляем список расходов после удаления
      await loadExpenses(false);

      return { success: true };
    } catch (err) {
      setError(err.message || 'Unknown error');
      return { success: false, error: { message: err.message } };
    } finally {
      setLoading(false);
    }
  }, [loadExpenses]);

  /**
   * useEffect для автоматической загрузки данных при монтировании компонента
   * Зависимости: [autoLoad, loadExpenses]
   * Выполняется один раз при монтировании, если autoLoad === true
   */
  useEffect(() => {
    if (autoLoad) {
      loadExpenses();
    }
  }, [autoLoad, loadExpenses]);

  return {
    expenses,
    loading,
    error,
    fromCache,
    loadExpenses,
    addExpense,
    removeExpense,
  };
};





