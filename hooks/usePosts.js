// Кастомный хук для работы с постами блога

import { useState, useEffect, useCallback } from 'react';
import { getPosts, createPost } from '../services/postsService';

/**
 * Хук для управления постами
 * @param {boolean} autoLoad - автоматически загружать данные
 */
export const usePosts = (autoLoad = true) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fromCache, setFromCache] = useState(false);

  const loadPosts = useCallback(async (useCache = true) => {
    setLoading(true);
    setError(null);

    try {
      const result = await getPosts(useCache);

      if (result.error) {
        setError(result.error.message || 'Failed to load posts');
        setPosts([]);
      } else {
        // API возвращает { posts: [...] }, извлекаем массив постов
        const postsArray = result.data?.posts || result.data || [];
        setPosts(postsArray);
        setFromCache(result.fromCache || false);
      }
    } catch (err) {
      setError(err.message || 'Unknown error');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const addPost = useCallback(async (postData) => {
    setLoading(true);
    setError(null);

    try {
      const result = await createPost(postData);

      if (result.error) {
        setError(result.error.message || 'Failed to create post');
        return { success: false, error: result.error };
      }

      await loadPosts(false);

      return { success: true, data: result.data };
    } catch (err) {
      setError(err.message || 'Unknown error');
      return { success: false, error: { message: err.message } };
    } finally {
      setLoading(false);
    }
  }, [loadPosts]);

  useEffect(() => {
    if (autoLoad) {
      loadPosts();
    }
  }, [autoLoad, loadPosts]);

  return {
    posts,
    loading,
    error,
    fromCache,
    loadPosts,
    addPost,
  };
};





