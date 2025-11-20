// Кастомный хук для работы с лидербордом

import { useState, useEffect, useCallback } from 'react';
import { getLeaderboard } from '../services/leaderboardService';

/**
 * Хук для управления лидербордом
 * @param {boolean} autoLoad - автоматически загружать данные
 */
export const useLeaderboard = (autoLoad = true) => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fromCache, setFromCache] = useState(false);

  const loadLeaderboard = useCallback(async (useCache = true) => {
    setLoading(true);
    setError(null);

    try {
      const result = await getLeaderboard(useCache);

      if (result.error) {
        setError(result.error.message || 'Failed to load leaderboard');
        setLeaderboard([]);
      } else {
        setLeaderboard(result.data || []);
        setFromCache(result.fromCache || false);
      }
    } catch (err) {
      setError(err.message || 'Unknown error');
      setLeaderboard([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoLoad) {
      loadLeaderboard();
    }
  }, [autoLoad, loadLeaderboard]);

  return {
    leaderboard,
    loading,
    error,
    fromCache,
    loadLeaderboard,
  };
};




