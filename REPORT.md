## Лабораторная работа №2  
**Тема:** Создание основного макета мобильного приложения  

### 1. Введение
Цель лабораторной работы — **создать базовую структуру мобильного приложения** с использованием фреймворка React Native (Expo) и продемонстрировать основные компоненты интерфейса: экраны, кнопки, поля ввода и навигацию между экранами.

В рамках работы необходимо:
- **Выбрать мобильную платформу и настроить среду разработки.**
- **Создать основной макет приложения** с несколькими экранами.
- **Прокомментировать код** и описать принятые решения.

### 2. Выбор платформы и настройка среды разработки
В качестве платформы разработки было выбрано **React Native** с использованием **Expo**:
- Expo упрощает создание и запуск мобильных приложений на Android и iOS.
- Не требуется ручная настройка нативных проектов под каждую платформу.

**Основные шаги настройки среды:**
1. Установить Node.js и npm (если не установлены).
2. В терминале выполнить команду для создания проекта:

```bash
npx create-expo-app@latest lab2-app --template blank --yes
```

3. Перейти в созданную папку проекта:

```bash
cd lab2-app
```

4. Запустить проект:

```bash
npm start
```

### 3. Описание структуры базового проекта
После генерации проекта Expo создаются основные файлы:
- `App.js` — главный файл приложения, точка входа.
- `package.json` — список зависимостей и скриптов.
- `app.json` / `app.config.js` — конфигурация Expo-приложения.

В рамках лабораторной работы основная логика размещена в файле `App.js`.

Приложение содержит:
- **Пятиэкранную структуру финансового трекера**:
  - `Обзор` — карточка общих расходов, экономии и список последних операций.
  - `Категории` — бюджеты по направлениям с прогресс-барами.
  - `Лидерборд` — таблица сравнения друзей по «баллам экономии».
  - `Блог` — карточки статей финансового клуба.
  - `Профиль` — карточка пользователя со статистикой и CTA.
- **Ручную таб-навигацию** на `TouchableOpacity`, которая одинаково работает на Android/iOS/Web без сторонних библиотек.
- **Моки данных**, имитирующие реальные API: массивы расходов, категорий, постов и лидеров.

### 4. Листинг и комментарии к основному коду
Ниже приведён основной код приложения из файла `App.js` с комментариями.

```javascript
// Главный файл приложения React Native (Expo).
// Макет финансового трекера с пятью разделами и ручной навигацией.

import { StatusBar } from 'expo-status-bar';
import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';

const MOCK_EXPENSES = [
  { id: 1, title: 'Продукты', amount: 4200, category: 'Дом', date: '18 ноя' },
  { id: 2, title: 'Проезд', amount: 900, category: 'Транспорт', date: '18 ноя' },
  { id: 3, title: 'Подписки', amount: 699, category: 'Досуг', date: '17 ноя' },
];

const MOCK_CATEGORIES = [
  { id: 'home', title: 'Дом', spent: 12000, limit: 15000 },
  { id: 'food', title: 'Еда', spent: 8700, limit: 10000 },
  { id: 'fun', title: 'Досуг', spent: 3100, limit: 8000 },
  { id: 'health', title: 'Здоровье', spent: 2200, limit: 5000 },
];

const TAB_LABELS = {
  dashboard: 'Обзор',
  categories: 'Категории',
  leaderboard: 'Лидерборд',
  blog: 'Блог',
  profile: 'Профиль',
};

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const summary = useMemo(() => {
    const total = MOCK_EXPENSES.reduce((acc, exp) => acc + exp.amount, 0);
    const limit = MOCK_CATEGORIES.reduce((acc, cat) => acc + cat.limit, 0);
    const spent = MOCK_CATEGORIES.reduce((acc, cat) => acc + cat.spent, 0);
    return { total, saved: limit - spent };
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'categories':
        return <CategoriesScreen />;
      case 'leaderboard':
        return <LeaderboardScreen />;
      case 'blog':
        return <BlogScreen />;
      case 'profile':
        return <ProfileScreen />;
      default:
        return <DashboardScreen summary={summary} />;
    }
  };

  return (
    <View style={styles.appContainer}>
      {renderContent()}
      <View style={styles.tabBar}>
        {Object.keys(TAB_LABELS).map((tab) => (
          <TabButton
            key={tab}
            label={TAB_LABELS[tab]}
            isActive={activeTab === tab}
            onPress={() => setActiveTab(tab)}
          />
        ))}
      </View>
      <StatusBar style="auto" />
    </View>
  );
}

function DashboardScreen({ summary }) {
  return (
    <ScrollView contentContainerStyle={styles.screenContainer}>
      <Text style={styles.title}>Общие расходы</Text>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Траты за неделю</Text>
        <Text style={styles.summaryValue}>{summary.total.toLocaleString()} ₽</Text>
        <Text style={styles.summarySubtext}>
          Экономия по плану: {summary.saved.toLocaleString()} ₽
        </Text>
      </View>
      {/* Здесь же выводится список последних операций */}
      {MOCK_EXPENSES.map((expense) => (
        <View key={expense.id} style={styles.expenseCard}>
          <View>
            <Text style={styles.expenseTitle}>{expense.title}</Text>
            <Text style={styles.expenseMeta}>
              {expense.category} • {expense.date}
            </Text>
          </View>
          <Text style={styles.expenseAmount}>-{expense.amount} ₽</Text>
        </View>
      ))}
    </ScrollView>
  );
}

function CategoriesScreen() {
  return (
    <ScrollView contentContainerStyle={styles.screenContainer}>
      <Text style={styles.title}>Категории расходов</Text>
      {MOCK_CATEGORIES.map((category) => {
        const progress = Math.min(category.spent / category.limit, 1);
        return (
          <View key={category.id} style={styles.categoryCard}>
            <View style={styles.categoryHeader}>
              <Text style={styles.categoryTitle}>{category.title}</Text>
              <Text style={styles.categoryAmount}>
                {category.spent}/{category.limit} ₽
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { flex: progress }]} />
              <View style={{ flex: Math.max(1 - progress, 0) }} />
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

// Аналогично оформлены LeaderboardScreen, BlogScreen и ProfileScreen:
// каждый экран использует свои моки данных и отображает карточки/статистику.

function TabButton({ label, isActive, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.tabButton, isActive && styles.tabButtonActive]}
      onPress={onPress}
    >
      <Text style={[styles.tabButtonText, isActive && styles.tabButtonTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    paddingTop: 32,
  },
  screenContainer: {
    padding: 16,
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
  },
  summaryCard: {
    backgroundColor: '#1f2937',
    borderRadius: 16,
    padding: 20,
  },
  summaryLabel: {
    color: '#d1d5db',
  },
  summaryValue: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '700',
    marginVertical: 8,
  },
  summarySubtext: {
    color: '#9ca3af',
  },
  expenseCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
  },
  expenseTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  expenseMeta: {
    color: '#6b7280',
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
  },
  categoryCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    gap: 8,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressBar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 999,
    backgroundColor: '#e5e7eb',
    overflow: 'hidden',
  },
  progressFill: {
    backgroundColor: '#10b981',
  },
  tabBar: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#e5e7eb',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#dbeafe',
  },
  tabButtonText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  tabButtonTextActive: {
    color: '#1e3a8a',
  },
});
```

### 5. Описание шагов создания базового проекта и принятых решений
При создании базового проекта были приняты следующие решения:

1. **Использование Expo и React Native.**  
   Это упростило настройку окружения и запуск приложения на разных платформах.

2. **Реализация собственной навигации на базе состояния.**  
   Чтобы приложение одинаково работало на всех платформах и не зависело от внешних библиотек, табы и переходы реализованы вручную при помощи `useState` и отдельных компонентов.

3. **Разделение приложения на экраны.**
   - `DashboardScreen` — карточка суммарных расходов и список последних операций.
   - `CategoriesScreen` — бюджеты по направлениям с прогресс-барами.
   - `LeaderboardScreen` — таблица сравнения друзей и тренды.
   - `BlogScreen` — карточки постов.
   - `ProfileScreen` — карточка пользователя со статистикой.

4. **Понятные имена компонентов и стилей.**  
   Имена экранам (`HomeScreen`, `ProfileScreen`, `SettingsScreen`), а также стилям (`screenContainer`, `title`, `infoText`) даны так, чтобы их назначение было очевидно при чтении кода.

5. **Подробное комментирование кода.**  
   В коде указаны комментарии к основным секциям (данные, вкладки, экраны), что облегчает дальнейшее развитие макета.

### 6. Ссылка на репозиторий GitHub
После создания удалённого репозитория необходимо:

1. Инициализировать git в папке проекта:

```bash
git init
git add .
git commit -m \"Initial lab2 app\"
```

2. Добавить удалённый репозиторий и отправить изменения:

```bash
git remote add origin <URL_ВАШЕГО_РЕПОЗИТОРИЯ>
git push -u origin main
```

3. Указать здесь ссылку на репозиторий, например:  
`https://github.com/<ваш-аккаунт>/lab2-app`

### 7. Инструкция по запуску приложения
Для запуска приложения из репозитория:

1. Клонировать репозиторий:

```bash
git clone https://github.com/<ваш-аккаунт>/lab2-app.git
cd lab2-app
```

2. Установить зависимости:

```bash
npm install
```

3. Запустить Expo:

```bash
npm start
```

4. Открыть приложение:
- через приложение Expo Go на Android (отсканировать QR-код из терминала или браузера),
- или запустить эмулятор Android (`npm run android`),
- или запустить веб-версию (`npm run web`).

### 8. Заключение
В ходе лабораторной работы был создан **макет мобильного финансового трекера** на базе React Native и Expo.  
Приложение демонстрирует:
- пятиэкранную структуру с ручной таб-навигацией;
- отображение агрегированных данных (расходы, бюджеты, лидерборд);
- контентные разделы (блог) и профиль с пользовательской статистикой;
- архитектуру, готовую к подключению реальных API без изменения UI.

Полученная структура может быть использована как основа для дальнейшего развития проекта (подключение бэкенда, авторизации и т.д.).


