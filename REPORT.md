## Лабораторная работа №3
**Тема:** Управление ресурсами мобильного приложения и использование хуков

### 1. Введение

**Цель лабораторной работы:** Научиться эффективно управлять ресурсами мобильного приложения и использовать хуки для управления состоянием и жизненным циклом компонентов.

**Задачи:**
1. **Управление ресурсами приложения** — реализовать работу с данными, API запросами, локальным хранилищем и другими ресурсами.
2. **Использование хуков для управления состоянием** — применить различные хуки (useState, useEffect, useMemo, useCallback) для управления состоянием компонентов, обработки событий и выполнения действий в зависимости от жизненного цикла компонентов.

### 2. Выбор платформы и настройка среды разработки

В качестве платформы разработки было выбрано **React Native** с использованием **Expo**:
- Expo упрощает создание и запуск мобильных приложений на Android и iOS.
- Не требуется ручная настройка нативных проектов под каждую платформу.
- Поддержка работы с локальным хранилищем через AsyncStorage.

**Основные шаги настройки среды:**

1. Установить Node.js и npm (если не установлены).

2. Создать проект на базе существующего макета из лабораторной работы №2:
```bash
cd lab3
npm install
```

3. Установить дополнительные зависимости для работы с ресурсами:
```bash
npm install @react-native-async-storage/async-storage
```

4. Настроить конфигурацию API в `config/api.js`:
```javascript
export const API_BASE_URL = 'http://localhost:3000'; // или URL твоего деплоя
```

5. Запустить проект:
```bash
npm start
```

### 3. Описание структуры проекта

Проект организован по **микросервисной архитектуре**, что упрощает разработку и поддержку:

```
lab3/
├── config/
│   └── api.js              # Конфигурация API и эндпоинтов
├── services/               # Микросервисы для каждого домена
│   ├── expensesService.js  # Управление расходами
│   ├── categoriesService.js # Управление категориями
│   ├── leaderboardService.js # Лидерборд
│   ├── postsService.js      # Посты блога
│   └── profileService.js   # Профиль пользователя
├── hooks/                  # Кастомные хуки
│   ├── useExpenses.js      # Хук для работы с расходами
│   ├── useCategories.js    # Хук для работы с категориями
│   ├── useLeaderboard.js   # Хук для работы с лидербордом
│   ├── usePosts.js         # Хук для работы с постами
│   └── useProfile.js       # Хук для работы с профилем
├── utils/                  # Утилиты
│   ├── apiClient.js        # HTTP клиент для API
│   └── storage.js          # Работа с AsyncStorage
└── App.js                  # Главный компонент приложения
```

### 4. Управление ресурсами приложения

#### 4.1. Работа с API

**HTTP клиент (`utils/apiClient.js`):**
Централизованный клиент для выполнения запросов к API с обработкой ошибок и авторизации.

```javascript
// utils/apiClient.js
import { API_BASE_URL } from '../config/api';
import { loadFromStorage, STORAGE_KEYS } from './storage';

/**
 * Выполняет HTTP запрос к API
 * @param {string} endpoint - эндпоинт API
 * @param {object} options - опции запроса (method, body, headers)
 * @returns {Promise<{data: any, error: any}>}
 */
export const apiRequest = async (endpoint, options = {}) => {
  const { method = 'GET', body, headers = {} } = options;
  const url = `${API_BASE_URL}${endpoint}`;

  // Получаем токен авторизации из локального хранилища
  const token = await loadFromStorage(STORAGE_KEYS.AUTH_TOKEN);

  const requestHeaders = {
    'Content-Type': 'application/json',
    ...headers,
  };

  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        data: null,
        error: {
          message: data.error || 'Request failed',
          status: response.status,
        },
      };
    }

    return { data, error: null };
  } catch (error) {
    console.error('API request error:', error);
    return {
      data: null,
      error: {
        message: error.message || 'Network error',
        status: 0,
      },
    };
  }
};
```

**Микросервисы (`services/`):**
Каждый домен имеет свой независимый сервис, который инкапсулирует логику работы с API.

Пример: `services/expensesService.js`:
```javascript
// services/expensesService.js
import { apiGet, apiPost, apiDelete } from '../utils/apiClient';
import { API_ENDPOINTS } from '../config/api';
import { cacheService, STORAGE_KEYS, removeFromStorage } from '../utils/storage';

/**
 * Получает список расходов пользователя
 * Использует кэширование для оптимизации производительности
 */
export const getExpenses = async (useCache = true) => {
  // Пытаемся загрузить из кэша
  if (useCache) {
    const cached = await cacheService.loadCache(STORAGE_KEYS.EXPENSES_CACHE);
    if (cached) {
      console.log('Loading expenses from cache');
      return { data: cached, error: null, fromCache: true };
    }
  }

  // Если кэша нет, делаем запрос к API
  const result = await apiGet(API_ENDPOINTS.EXPENSES.LIST);

  // Сохраняем в кэш при успешном ответе
  if (result.data && !result.error) {
    await cacheService.saveCache(STORAGE_KEYS.EXPENSES_CACHE, result.data);
  }

  return { ...result, fromCache: false };
};

/**
 * Создает новый расход
 */
export const createExpense = async (expenseData) => {
  const result = await apiPost(API_ENDPOINTS.EXPENSES.CREATE, expenseData);

  // Инвалидируем кэш при успешном создании
  if (result.data && !result.error) {
    await removeFromStorage(STORAGE_KEYS.EXPENSES_CACHE);
  }

  return result;
};
```

#### 4.2. Локальное хранилище (AsyncStorage)

**Утилита для работы с хранилищем (`utils/storage.js`):**

```javascript
// utils/storage.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  AUTH_TOKEN: '@auth_token',
  USER_DATA: '@user_data',
  EXPENSES_CACHE: '@expenses_cache',
  CATEGORIES_CACHE: '@categories_cache',
  LEADERBOARD_CACHE: '@leaderboard_cache',
  POSTS_CACHE: '@posts_cache',
};

/**
 * Сохраняет данные в локальное хранилище
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
 * Сервис кэширования с временными метками
 */
export const cacheService = {
  // Сохраняет кэш данных с временной меткой
  saveCache: async (key, data) => {
    const cacheData = {
      data,
      timestamp: Date.now(),
    };
    return saveToStorage(key, cacheData);
  },

  // Загружает кэш, если он не устарел (по умолчанию 5 минут)
  loadCache: async (key, maxAge = 5 * 60 * 1000) => {
    const cached = await loadFromStorage(key);
    if (!cached || !cached.timestamp) return null;

    const age = Date.now() - cached.timestamp;
    if (age > maxAge) {
      await removeFromStorage(key);
      return null;
    }

    return cached.data;
  },
};
```

### 5. Использование хуков для управления состоянием

#### 5.1. Базовые хуки React

**useState** — управление локальным состоянием компонентов:
```javascript
// Управление активной вкладкой
const [activeTab, setActiveTab] = useState('dashboard');

// Состояние загрузки данных
const [loading, setLoading] = useState(false);

// Состояние ошибки
const [error, setError] = useState(null);
```

**useMemo** — оптимизация вычислений:
```javascript
// Вычисление суммы расходов только при изменении expenses
const summary = useMemo(() => {
  if (!expenses || expenses.length === 0) {
    return { total: 0, count: 0 };
  }

  const total = expenses.reduce((acc, exp) => {
    const amount = typeof exp.amount === 'string' 
      ? parseFloat(exp.amount) 
      : Number(exp.amount);
    return acc + (isNaN(amount) ? 0 : amount);
  }, 0);

  return { total, count: expenses.length };
}, [expenses]); // Зависимость: пересчитывается только при изменении expenses
```

**useCallback** — мемоизация функций:
```javascript
// Функция для загрузки расходов
const loadExpenses = useCallback(async (useCache = true) => {
  setLoading(true);
  setError(null);

  try {
    const result = await getExpenses(useCache);
    // ... обработка результата
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
}, []); // Пустой массив зависимостей = функция создается один раз
```

**useEffect** — выполнение побочных эффектов (загрузка данных при монтировании):
```javascript
// Автоматическая загрузка данных при монтировании компонента
useEffect(() => {
  if (autoLoad) {
    loadExpenses();
  }
}, [autoLoad, loadExpenses]); // Выполняется при монтировании и при изменении зависимостей
```

#### 5.2. Кастомные хуки

**Пример: `hooks/useExpenses.js`**

```javascript
// hooks/useExpenses.js
import { useState, useEffect, useCallback } from 'react';
import { getExpenses, createExpense, deleteExpense } from '../services/expensesService';

/**
 * Хук для управления расходами
 * Использует useState для хранения состояния и useEffect для загрузки данных
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
   * Использует useCallback для мемоизации функции
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
      await loadExpenses(false); // false = не использовать кэш

      return { success: true, data: result.data };
    } catch (err) {
      setError(err.message || 'Unknown error');
      return { success: false, error: { message: err.message } };
    } finally {
      setLoading(false);
    }
  }, [loadExpenses]);

  /**
   * useEffect для автоматической загрузки данных при монтировании компонента
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
  };
};
```

**Использование кастомного хука в компоненте:**

```javascript
// App.js
import { useExpenses } from './hooks/useExpenses';

function DashboardScreen() {
  // Используем кастомный хук для загрузки расходов
  // Хук автоматически загружает данные при монтировании компонента (useEffect)
  const { expenses, loading, error, fromCache, loadExpenses } = useExpenses();

  // useMemo для вычисления суммы расходов
  const summary = useMemo(() => {
    if (!expenses || expenses.length === 0) {
      return { total: 0, count: 0 };
    }

    const total = expenses.reduce((acc, exp) => {
      const amount = typeof exp.amount === 'string' 
        ? parseFloat(exp.amount) 
        : Number(exp.amount);
      return acc + (isNaN(amount) ? 0 : amount);
    }, 0);

    return { total, count: expenses.length };
  }, [expenses]);

  // Функция для обновления данных (pull-to-refresh)
  const onRefresh = () => {
    loadExpenses(false); // false = не использовать кэш, получить свежие данные
  };

  if (loading && expenses.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Загрузка расходов...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <ScrollView
        contentContainerStyle={styles.centerContainer}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} />}
      >
        <Text style={styles.errorText}>Ошибка: {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
          <Text style={styles.retryButtonText}>Повторить</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.screenContainer}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} />}
    >
      <Text style={styles.title}>Общие расходы</Text>
      {fromCache && (
        <Text style={styles.cacheIndicator}>📦 Данные из кэша</Text>
      )}
      
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Всего расходов</Text>
        <Text style={styles.summaryValue}>
          {summary.total.toLocaleString('ru-RU', { minimumFractionDigits: 2 })} ₽
        </Text>
        <Text style={styles.summarySubtext}>
          Количество операций: {summary.count}
        </Text>
      </View>

      {/* Отображение списка расходов */}
      {expenses.length === 0 ? (
        <Text style={styles.emptyText}>Нет расходов</Text>
      ) : (
        expenses.slice(0, 10).map((expense) => (
          <View key={expense.id} style={styles.expenseCard}>
            {/* ... */}
          </View>
        ))
      )}
    </ScrollView>
  );
}
```

### 6. Полные листинги кода с комментариями

В данном разделе представлены полные листинги ключевых файлов с подробными комментариями, объясняющими принцип работы каждого участка кода.

#### 6.1. HTTP клиент для работы с API (`utils/apiClient.js`)

Полный код HTTP клиента с подробными комментариями, демонстрирующий управление ресурсами приложения:

```javascript
// HTTP клиент для работы с API
// Централизованная обработка запросов, ошибок и авторизации

import { API_BASE_URL } from '../config/api';
import { loadFromStorage, STORAGE_KEYS } from './storage';

/**
 * Выполняет HTTP запрос к API
 * Демонстрирует управление ресурсами: работа с сетью, обработка ошибок, авторизация
 * @param {string} endpoint - эндпоинт API
 * @param {object} options - опции запроса (method, body, headers и т.д.)
 * @returns {Promise<{data: any, error: any}>}
 */
export const apiRequest = async (endpoint, options = {}) => {
  const { method = 'GET', body, headers = {} } = options;

  // Формируем полный URL для запроса
  // API_BASE_URL настраивается в зависимости от платформы (localhost для веб, IP для устройства)
  const url = `${API_BASE_URL}${endpoint}`;

  // Управление ресурсами: загружаем токен авторизации из локального хранилища
  // Это демонстрирует работу с AsyncStorage для сохранения состояния между сессиями
  const token = await loadFromStorage(STORAGE_KEYS.AUTH_TOKEN);

  // Формируем заголовки запроса
  const requestHeaders = {
    'Content-Type': 'application/json',
    ...headers,
  };

  // Добавляем токен авторизации, если он есть
  // Это позволяет автоматически авторизовывать все запросы
  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`;
  }

  try {
    console.log(`[API] ${method} ${url}`);
    
    // Управление ресурсами: добавляем таймаут для запросов (30 секунд)
    // Это предотвращает бесконечное ожидание ответа от сервера
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    // Выполняем HTTP запрос
    // fetch - нативный API для работы с сетью в React Native
    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal, // Используем AbortController для возможности отмены запроса
    });
    
    clearTimeout(timeoutId);

    console.log(`[API] Response status: ${response.status} ${response.statusText}`);

    // Управление ресурсами: проверяем тип контента перед парсингом
    // Это предотвращает ошибки при парсинге не-JSON ответов
    const contentType = response.headers.get('content-type');
    const text = await response.text();
    
    let data;
    if (text && contentType && contentType.includes('application/json')) {
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        // Обработка ошибок: логируем ошибку парсинга для отладки
        console.error('[API] JSON parse error:', parseError, 'Response text:', text);
        return {
          data: null,
          error: {
            message: 'Invalid JSON response from server',
            status: response.status,
            originalError: parseError.message,
          },
        };
      }
    } else {
      // Если ответ не JSON, возвращаем текст или пустой объект
      data = text || {};
    }

    // Проверяем статус ответа
    if (!response.ok) {
      console.error(`[API] Error response:`, data);
      return {
        data: null,
        error: {
          message: data.error || data.message || 'Request failed',
          status: response.status,
        },
      };
    }

    // Успешный ответ
    console.log(`[API] Success:`, Array.isArray(data) ? `${data.length} items` : 'data received');
    return { data, error: null };
  } catch (error) {
    // Управление ресурсами: обработка сетевых ошибок
    console.error('[API] Request error:', error);
    console.error('[API] URL was:', url);
    
    // Более понятные сообщения об ошибках для пользователя
    let errorMessage = 'Network error';
    if (error.name === 'AbortError') {
      errorMessage = 'Request timeout. Сервер не отвечает слишком долго.';
    } else if (error.message === 'Network request failed') {
      errorMessage = `Не удалось подключиться к серверу. Убедись, что API сервер запущен и доступен по адресу ${API_BASE_URL}`;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return {
      data: null,
      error: {
        message: errorMessage,
        status: 0,
        originalError: error.message || error.name,
      },
    };
  }
};

/**
 * GET запрос - упрощенный метод для получения данных
 */
export const apiGet = (endpoint) => apiRequest(endpoint, { method: 'GET' });

/**
 * POST запрос - для создания новых ресурсов
 */
export const apiPost = (endpoint, body) =>
  apiRequest(endpoint, { method: 'POST', body });

/**
 * PUT запрос - для обновления существующих ресурсов
 */
export const apiPut = (endpoint, body) =>
  apiRequest(endpoint, { method: 'PUT', body });

/**
 * DELETE запрос - для удаления ресурсов
 */
export const apiDelete = (endpoint) =>
  apiRequest(endpoint, { method: 'DELETE' });
```

#### 6.2. Кастомный хук для работы с расходами (`hooks/useExpenses.js`)

Полный код кастомного хука с демонстрацией использования useState, useEffect, useCallback:

```javascript
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
  // useState: управление локальным состоянием компонента
  // Состояние для хранения списка расходов
  const [expenses, setExpenses] = useState([]);
  
  // Состояние загрузки данных - используется для отображения индикатора загрузки
  const [loading, setLoading] = useState(false);
  
  // Состояние ошибки - хранит информацию об ошибках при работе с API
  const [error, setError] = useState(null);
  
  // Флаг, показывающий, загружены ли данные из кэша
  // Позволяет отображать пользователю, откуда пришли данные (кэш или сервер)
  const [fromCache, setFromCache] = useState(false);

  /**
   * Функция для загрузки расходов
   * Использует useCallback для мемоизации функции и предотвращения лишних ререндеров
   * useCallback возвращает мемоизированную версию функции, которая изменяется только
   * при изменении зависимостей (в данном случае - никогда, так как массив зависимостей пуст)
   */
  const loadExpenses = useCallback(async (useCache = true) => {
    // Устанавливаем состояние загрузки
    setLoading(true);
    setError(null);

    try {
      // Вызываем сервис для получения данных
      // Сервис сам решает, использовать ли кэш или сделать запрос к API
      const result = await getExpenses(useCache);

      if (result.error) {
        // Обработка ошибки: сохраняем сообщение об ошибке в состоянии
        setError(result.error.message || 'Failed to load expenses');
        setExpenses([]);
      } else {
        // Успешная загрузка: обновляем состояние с полученными данными
        setExpenses(result.data || []);
        setFromCache(result.fromCache || false);
      }
    } catch (err) {
      // Обработка неожиданных ошибок
      setError(err.message || 'Unknown error');
      setExpenses([]);
    } finally {
      // finally блок гарантирует, что состояние загрузки будет сброшено
      // даже если произошла ошибка
      setLoading(false);
    }
  }, []); // Пустой массив зависимостей означает, что функция создается один раз

  /**
   * Функция для добавления нового расхода
   * Демонстрирует работу с ресурсами: создание нового ресурса через API
   */
  const addExpense = useCallback(async (expenseData) => {
    setLoading(true);
    setError(null);

    try {
      // Вызываем сервис для создания нового расхода
      const result = await createExpense(expenseData);

      if (result.error) {
        setError(result.error.message || 'Failed to create expense');
        return { success: false, error: result.error };
      }

      // После успешного создания перезагружаем список расходов
      // false = не использовать кэш, получить свежие данные с сервера
      // Это гарантирует, что новый расход будет отображен в списке
      await loadExpenses(false);

      return { success: true, data: result.data };
    } catch (err) {
      setError(err.message || 'Unknown error');
      return { success: false, error: { message: err.message } };
    } finally {
      setLoading(false);
    }
  }, [loadExpenses]); // Зависимость от loadExpenses

  /**
   * Функция для удаления расхода
   * Демонстрирует работу с ресурсами: удаление ресурса через API
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
   * useEffect: выполнение побочных эффектов при монтировании компонента
   * Жизненный цикл компонента:
   * 1. Компонент монтируется
   * 2. useEffect выполняется (если autoLoad === true)
   * 3. loadExpenses вызывается автоматически
   * 4. Данные загружаются и состояние обновляется
   * 
   * Зависимости: [autoLoad, loadExpenses]
   * - useEffect будет выполнен при монтировании
   * - useEffect будет выполнен при изменении autoLoad
   * - useEffect будет выполнен при изменении loadExpenses (но loadExpenses мемоизирован, так что это не произойдет)
   */
  useEffect(() => {
    if (autoLoad) {
      loadExpenses();
    }
  }, [autoLoad, loadExpenses]);

  // Возвращаем объект с состоянием и функциями
  // Это позволяет компонентам использовать хук и получать доступ к данным и методам
  return {
    expenses,        // Список расходов
    loading,         // Флаг загрузки
    error,           // Сообщение об ошибке (или null)
    fromCache,       // Флаг, показывающий, загружены ли данные из кэша
    loadExpenses,    // Функция для ручной загрузки данных
    addExpense,      // Функция для добавления нового расхода
    removeExpense,   // Функция для удаления расхода
  };
};
```

#### 6.3. Использование хуков в компоненте (`App.js` - фрагмент)

Пример использования кастомного хука и других хуков в компоненте:

```javascript
// Главный файл приложения React Native (Expo)
// Демонстрирует работу с API, локальным хранилищем и хуками для управления состоянием

import React, { useMemo, useState } from 'react';
import { useExpenses } from './hooks/useExpenses';

// -------------------- ЭКРАН "ОБЗОР РАСХОДОВ" --------------------
// Демонстрирует использование кастомного хука useExpenses
function DashboardScreen() {
  // Используем кастомный хук для загрузки расходов
  // Хук автоматически загружает данные при монтировании компонента (useEffect внутри хука)
  // Возвращает объект с состоянием (expenses, loading, error) и функциями (loadExpenses, addExpense, removeExpense)
  const { expenses, loading, error, fromCache, loadExpenses } = useExpenses();

  // useMemo: оптимизация вычислений
  // Вычисление суммы расходов происходит только при изменении expenses
  // Это предотвращает лишние вычисления при каждом ререндере компонента
  // Зависимость: [expenses] - пересчитывается только при изменении expenses
  const summary = useMemo(() => {
    if (!expenses || expenses.length === 0) {
      return { total: 0, count: 0 };
    }

    // Вычисляем общую сумму расходов
    const total = expenses.reduce((acc, exp) => {
      // Преобразуем Decimal в число (API может возвращать строки)
      const amount = typeof exp.amount === 'string' 
        ? parseFloat(exp.amount) 
        : Number(exp.amount);
      return acc + (isNaN(amount) ? 0 : amount);
    }, 0);

    return {
      total,
      count: expenses.length,
    };
  }, [expenses]); // Зависимость: пересчитывается только при изменении expenses

  // Функция для обновления данных (pull-to-refresh)
  // Вызывается при обновлении списка пользователем
  const onRefresh = () => {
    // false = не использовать кэш, получить свежие данные с сервера
    loadExpenses(false);
  };

  // Условный рендеринг на основе состояния загрузки
  if (loading && expenses.length === 0) {
    // Показываем индикатор загрузки, если данные еще не загружены
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Загрузка расходов...</Text>
      </View>
    );
  }

  // Условный рендеринг на основе состояния ошибки
  if (error) {
    return (
      <ScrollView
        contentContainerStyle={styles.centerContainer}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} />}
      >
        <Text style={styles.errorText}>Ошибка: {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
          <Text style={styles.retryButtonText}>Повторить</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // Основной рендеринг списка расходов
  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} />}
    >
      {/* Отображение информации о кэше */}
      {fromCache && (
        <Text style={styles.cacheInfo}>Данные загружены из кэша</Text>
      )}
      
      {/* Отображение сводки расходов */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Всего расходов:</Text>
        <Text style={styles.summaryValue}>{summary.count}</Text>
        <Text style={styles.summaryLabel}>Общая сумма:</Text>
        <Text style={styles.summaryAmount}>{summary.total.toFixed(2)} ₽</Text>
      </View>

      {/* Список расходов */}
      {expenses.map((expense) => (
        <ExpenseCard key={expense.id} expense={expense} />
      ))}
    </ScrollView>
  );
}
```

#### 6.4. Работа с локальным хранилищем (`utils/storage.js`)

Полный код утилиты для работы с AsyncStorage:

```javascript
// Утилита для работы с локальным хранилищем (AsyncStorage)
// Демонстрирует управление ресурсами приложения через локальное хранилище

import AsyncStorage from '@react-native-async-storage/async-storage';

// Ключи для хранения данных
// Используются для организации данных в хранилище
const STORAGE_KEYS = {
  AUTH_TOKEN: '@auth_token',           // Токен авторизации
  USER_DATA: '@user_data',              // Данные пользователя
  EXPENSES_CACHE: '@expenses_cache',    // Кэш расходов
  CATEGORIES_CACHE: '@categories_cache', // Кэш категорий
  LEADERBOARD_CACHE: '@leaderboard_cache', // Кэш лидерборда
  POSTS_CACHE: '@posts_cache',         // Кэш постов
  CACHE_TIMESTAMP: '@cache_timestamp',  // Временные метки кэша
};

/**
 * Сохраняет данные в локальное хранилище
 * Управление ресурсами: сохранение данных для использования между сессиями
 * @param {string} key - ключ для хранения
 * @param {any} value - значение для сохранения (будет сериализовано в JSON)
 * @returns {Promise<boolean>} - true если успешно, false если ошибка
 */
export const saveToStorage = async (key, value) => {
  try {
    // AsyncStorage может хранить только строки, поэтому сериализуем в JSON
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
    return true;
  } catch (error) {
    // Обработка ошибок: логируем, но не прерываем выполнение
    console.error('Error saving to storage:', error);
    return false;
  }
};

/**
 * Загружает данные из локального хранилища
 * Управление ресурсами: восстановление данных из локального хранилища
 * @param {string} key - ключ для загрузки
 * @returns {Promise<any|null>} - десериализованное значение или null
 */
export const loadFromStorage = async (key) => {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    // Если значение существует, десериализуем из JSON
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (error) {
    console.error('Error loading from storage:', error);
    return null;
  }
};

/**
 * Удаляет данные из локального хранилища
 * Управление ресурсами: очистка данных из хранилища
 * @param {string} key - ключ для удаления
 * @returns {Promise<boolean>} - true если успешно
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
 * Используется при выходе из приложения или сбросе данных
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
// Демонстрируют управление ресурсами: кэширование данных с временными метками
export const cacheService = {
  /**
   * Сохраняет кэш данных с временной меткой
   * Управление ресурсами: сохранение данных с информацией о времени создания
   * @param {string} key - ключ для кэша
   * @param {any} data - данные для кэширования
   */
  saveCache: async (key, data) => {
    const cacheData = {
      data,                    // Сами данные
      timestamp: Date.now(),   // Временная метка создания кэша
    };
    return saveToStorage(key, cacheData);
  },

  /**
   * Загружает кэш, если он не устарел
   * Управление ресурсами: проверка актуальности кэшированных данных
   * @param {string} key - ключ для кэша
   * @param {number} maxAge - максимальный возраст кэша в миллисекундах (по умолчанию 5 минут)
   * @returns {Promise<any|null>} - данные из кэша или null если кэш устарел/отсутствует
   */
  loadCache: async (key, maxAge = 5 * 60 * 1000) => {
    // maxAge по умолчанию 5 минут (5 * 60 * 1000 миллисекунд)
    const cached = await loadFromStorage(key);
    
    // Проверяем, существует ли кэш
    if (!cached || !cached.timestamp) return null;

    // Вычисляем возраст кэша
    const age = Date.now() - cached.timestamp;
    
    // Если кэш устарел, удаляем его и возвращаем null
    if (age > maxAge) {
      await removeFromStorage(key);
      return null;
    }

    // Кэш актуален, возвращаем данные
    return cached.data;
  },
};

// Экспортируем ключи для использования в других модулях
export { STORAGE_KEYS };
```

### 7. Описание реализованных ресурсов и их управления

#### 6.1. API ресурсы

**Эндпоинты:**
- `/api/expenses` — получение и создание расходов
- `/api/categories` — получение и создание категорий
- `/api/leaderboard` — получение лидерборда
- `/api/posts` — получение и создание постов
- `/api/profile` — получение и обновление профиля

**Особенности:**
- Централизованная обработка ошибок через `apiClient.js`
- Автоматическое добавление токена авторизации из локального хранилища
- Поддержка различных HTTP методов (GET, POST, PUT, DELETE)

#### 6.2. Локальное хранилище

**Типы данных:**
- **Токены авторизации** — для аутентификации запросов
- **Данные пользователя** — профиль пользователя
- **Кэш данных** — расходы, категории, лидерборд, посты с временными метками

**Стратегия кэширования:**
- Кэш сохраняется с временной меткой
- Кэш автоматически инвалидируется при изменении данных (создание, обновление, удаление)
- Кэш устаревает через 5 минут (настраивается)

#### 6.3. Управление жизненным циклом компонентов

**Этапы жизненного цикла:**
1. **Монтирование** — `useEffect` с пустым массивом зависимостей загружает данные
2. **Обновление** — `useEffect` с зависимостями реагирует на изменения
3. **Размонтирование** — очистка ресурсов (если необходимо)

**Пример:**
```javascript
useEffect(() => {
  // Выполняется при монтировании компонента
  if (autoLoad) {
    loadExpenses();
  }

  // Очистка при размонтировании (если необходимо)
  return () => {
    // Можно отменить запросы, очистить таймеры и т.д.
  };
}, [autoLoad, loadExpenses]);
```

### 7. Объяснение использования хуков для управления состоянием компонентов

#### 7.1. useState

**Назначение:** Хранение локального состояния компонента.

**Примеры использования:**
- Управление активной вкладкой: `const [activeTab, setActiveTab] = useState('dashboard')`
- Состояние загрузки: `const [loading, setLoading] = useState(false)`
- Состояние ошибки: `const [error, setError] = useState(null)`
- Список данных: `const [expenses, setExpenses] = useState([])`

#### 7.2. useEffect

**Назначение:** Выполнение побочных эффектов (загрузка данных, подписки, таймеры).

**Варианты использования:**
- **При монтировании:** `useEffect(() => { loadData(); }, [])`
- **При изменении зависимостей:** `useEffect(() => { updateData(); }, [dependency])`
- **Очистка при размонтировании:** `useEffect(() => { return () => cleanup(); }, [])`

#### 7.3. useMemo

**Назначение:** Мемоизация вычислений для оптимизации производительности.

**Пример:**
```javascript
const summary = useMemo(() => {
  // Тяжелые вычисления
  return expenses.reduce((acc, exp) => acc + exp.amount, 0);
}, [expenses]); // Пересчитывается только при изменении expenses
```

#### 7.4. useCallback

**Назначение:** Мемоизация функций для предотвращения лишних ререндеров.

**Пример:**
```javascript
const loadExpenses = useCallback(async (useCache) => {
  // Логика загрузки
}, []); // Функция создается один раз
```

### 8. Ссылка на репозиторий GitHub

После создания удалённого репозитория:

1. Инициализировать git в папке проекта:
```bash
git init
git add .
git commit -m "Lab3: Resource management and hooks"
```

2. Добавить удалённый репозиторий и отправить изменения:
```bash
git remote add origin <URL_ВАШЕГО_РЕПОЗИТОРИЯ>
git push -u origin main
```

3. Ссылка на репозиторий:  
`https://github.com/danpolyprog17/mobrazr2025lab2`

### 9. Инструкция по запуску приложения

1. **Клонировать репозиторий:**
```bash
git clone https://github.com/danpolyprog17/mobrazr2025lab2.git
cd mobrazr2025lab2
```

2. **Установить зависимости:**
```bash
npm install
```

3. **Настроить API URL:**
Отредактировать `config/api.js` и указать URL твоего Next.js сервера.

4. **Запустить Expo:**
```bash
npm start
```

5. **Открыть приложение:**
- через приложение Expo Go (отсканировать QR-код),
- или запустить эмулятор: `npm run android`,
- или запустить веб-версию: `npm run web`.

### 10. Заключение

В ходе лабораторной работы было реализовано **управление ресурсами мобильного приложения** и **использование хуков** для управления состоянием и жизненным циклом компонентов.

**Достигнуто:**
- ✅ Микросервисная архитектура для разделения ответственности
- ✅ Работа с API через централизованный HTTP клиент
- ✅ Локальное хранилище (AsyncStorage) для кэширования данных
- ✅ Кастомные хуки для инкапсуляции логики работы с ресурсами
- ✅ Использование useState, useEffect, useMemo, useCallback
- ✅ Обработка состояний загрузки и ошибок
- ✅ Оптимизация производительности через кэширование и мемоизацию

**Полученные навыки:**
- Управление ресурсами приложения (API, локальное хранилище)
- Использование хуков для управления состоянием и жизненным циклом
- Организация кода по микросервисной архитектуре
- Оптимизация производительности через кэширование и мемоизацию

Полученная структура может быть использована как основа для дальнейшего развития проекта с подключением реального бэкенда и расширением функциональности.
