// Кастомный хук для работы с профилем пользователя

import { useState, useEffect, useCallback } from 'react';
import { getProfile, updateProfile } from '../services/profileService';

/**
 * Хук для управления профилем пользователя
 * @param {boolean} autoLoad - автоматически загружать данные
 */
export const useProfile = (autoLoad = true) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fromCache, setFromCache] = useState(false);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getProfile();

      if (result.error) {
        setError(result.error.message || 'Failed to load profile');
        setProfile(null);
      } else {
        // API может возвращать { user: {...} } или напрямую объект пользователя
        const userData = result.data?.user || result.data || null;
        setProfile(userData);
        setFromCache(result.fromCache || false);
      }
    } catch (err) {
      setError(err.message || 'Unknown error');
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProfileData = useCallback(async (profileData) => {
    setLoading(true);
    setError(null);

    try {
      const result = await updateProfile(profileData);

      if (result.error) {
        setError(result.error.message || 'Failed to update profile');
        return { success: false, error: result.error };
      }

      // Обновляем локальное состояние профиля
      const userData = result.data?.user || result.data || null;
      setProfile(userData);

      return { success: true, data: result.data };
    } catch (err) {
      setError(err.message || 'Unknown error');
      return { success: false, error: { message: err.message } };
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoLoad) {
      loadProfile();
    }
  }, [autoLoad, loadProfile]);

  return {
    profile,
    loading,
    error,
    fromCache,
    loadProfile,
    updateProfile: updateProfileData,
  };
};





