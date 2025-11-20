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

### 6. Описание реализованных ресурсов и их управления

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

3. Указать здесь ссылку на репозиторий, например:  
`https://github.com/<ваш-аккаунт>/mobrazr2025lab3`

### 9. Инструкция по запуску приложения

1. **Клонировать репозиторий:**
```bash
git clone https://github.com/<ваш-аккаунт>/mobrazr2025lab3.git
cd mobrazr2025lab3
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
