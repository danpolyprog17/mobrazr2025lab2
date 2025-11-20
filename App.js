// Главный файл приложения React Native (Expo).
// Лабораторная работа №3: Управление ресурсами и использование хуков
// Демонстрирует работу с API, локальным хранилищем и хуками для управления состоянием

import { StatusBar } from 'expo-status-bar';
import React, { useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';

// Импортируем кастомные хуки для работы с ресурсами
import { useExpenses } from './hooks/useExpenses';
import { useCategories } from './hooks/useCategories';
import { useLeaderboard } from './hooks/useLeaderboard';
import { usePosts } from './hooks/usePosts';
import { useProfile } from './hooks/useProfile';

// -------------------- ГЛАВНЫЙ КОМПОНЕНТ ПРИЛОЖЕНИЯ --------------------
export default function App() {
  // useState для управления активной вкладкой
  // Демонстрирует базовое использование хука useState
  const [activeTab, setActiveTab] = useState('dashboard');

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
        return <DashboardScreen />;
    }
  };

  return (
    <View style={styles.appContainer}>
      {renderContent()}
      <View style={styles.tabBar}>
        <TabButton
          label="Обзор"
          isActive={activeTab === 'dashboard'}
          onPress={() => setActiveTab('dashboard')}
        />
        <TabButton
          label="Категории"
          isActive={activeTab === 'categories'}
          onPress={() => setActiveTab('categories')}
        />
        <TabButton
          label="Лидерборд"
          isActive={activeTab === 'leaderboard'}
          onPress={() => setActiveTab('leaderboard')}
        />
        <TabButton
          label="Блог"
          isActive={activeTab === 'blog'}
          onPress={() => setActiveTab('blog')}
        />
        <TabButton
          label="Профиль"
          isActive={activeTab === 'profile'}
          onPress={() => setActiveTab('profile')}
        />
      </View>
      <StatusBar style="auto" />
    </View>
  );
}

// -------------------- ЭКРАН "ОБЗОР РАСХОДОВ" --------------------
// Демонстрирует использование кастомного хука useExpenses
function DashboardScreen() {
  // Используем кастомный хук для загрузки расходов
  // Хук автоматически загружает данные при монтировании компонента (useEffect)
  const { expenses, loading, error, fromCache, loadExpenses } = useExpenses();

  // useMemo для вычисления суммы расходов
  // Вычисляется только при изменении expenses, оптимизирует производительность
  const summary = useMemo(() => {
    if (!expenses || expenses.length === 0) {
      return { total: 0, count: 0 };
    }

    const total = expenses.reduce((acc, exp) => {
      // Преобразуем Decimal в число
      const amount = typeof exp.amount === 'string' ? parseFloat(exp.amount) : Number(exp.amount);
      return acc + (isNaN(amount) ? 0 : amount);
    }, 0);

    return {
      total,
      count: expenses.length,
    };
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
          {summary.total.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽
        </Text>
        <Text style={styles.summarySubtext}>
          Количество операций: {summary.count}
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Недавние расходы</Text>
      {expenses.length === 0 ? (
        <Text style={styles.emptyText}>Нет расходов</Text>
      ) : (
        expenses.slice(0, 10).map((expense) => {
          const amount = typeof expense.amount === 'string' 
            ? parseFloat(expense.amount) 
            : Number(expense.amount);
          const date = expense.spentAt 
            ? new Date(expense.spentAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
            : 'Дата не указана';
          
          return (
            <View key={expense.id} style={styles.expenseCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.expenseTitle}>
                  {expense.note || 'Без описания'}
                </Text>
                <Text style={styles.expenseMeta}>
                  {expense.category?.name || 'Без категории'} • {date}
                </Text>
              </View>
              <Text style={styles.expenseAmount}>
                -{isNaN(amount) ? '0' : amount.toLocaleString('ru-RU')} ₽
              </Text>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

// -------------------- ЭКРАН "КАТЕГОРИИ" --------------------
// Демонстрирует использование кастомного хука useCategories
function CategoriesScreen() {
  const { categories, loading, error, fromCache, loadCategories } = useCategories();

  const onRefresh = () => {
    loadCategories(false);
  };

  if (loading && categories.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Загрузка категорий...</Text>
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
      <Text style={styles.title}>Категории расходов</Text>
      {fromCache && (
        <Text style={styles.cacheIndicator}>📦 Данные из кэша</Text>
      )}

      {categories.length === 0 ? (
        <Text style={styles.emptyText}>Нет категорий</Text>
      ) : (
        categories.map((category) => {
          // Вычисляем прогресс на основе расходов в категории
          // В реальном приложении это должно приходить с сервера
          const progress = 0.5; // Заглушка, в реальности нужно считать из expenses

          return (
            <View key={category.id} style={styles.categoryCard}>
              <View style={styles.categoryHeader}>
                <View style={[styles.categoryColorDot, { backgroundColor: category.color || '#3B82F6' }]} />
                <Text style={styles.categoryTitle}>{category.name}</Text>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { flex: progress, backgroundColor: category.color || '#3B82F6' }]} />
                <View style={{ flex: Math.max(1 - progress, 0) }} />
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

// -------------------- ЭКРАН "ЛИДЕРБОРД" --------------------
// Демонстрирует использование кастомного хука useLeaderboard
function LeaderboardScreen() {
  const { leaderboard, loading, error, fromCache, loadLeaderboard } = useLeaderboard();

  const onRefresh = () => {
    loadLeaderboard(false);
  };

  if (loading && leaderboard.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Загрузка лидерборда...</Text>
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
      <Text style={styles.title}>Лидерборд экономии</Text>
      {fromCache && (
        <Text style={styles.cacheIndicator}>📦 Данные из кэша</Text>
      )}

      {leaderboard.length === 0 ? (
        <Text style={styles.emptyText}>Нет данных</Text>
      ) : (
        leaderboard.map((user, index) => {
          const total = typeof user.total === 'string' 
            ? parseFloat(user.total) 
            : Number(user.total) || 0;
          
          return (
            <View key={user.userId || index} style={styles.leaderCard}>
              <Text style={styles.leaderPosition}>{index + 1}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.leaderName}>{user.name || 'Неизвестный'}</Text>
                <Text style={styles.leaderScore}>
                  Расходы: {total.toLocaleString('ru-RU')} ₽
                </Text>
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

// -------------------- ЭКРАН "БЛОГ" --------------------
// Демонстрирует использование кастомного хука usePosts
function BlogScreen() {
  const { posts, loading, error, fromCache, loadPosts } = usePosts();

  const onRefresh = () => {
    loadPosts(false);
  };

  if (loading && posts.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Загрузка постов...</Text>
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
      <Text style={styles.title}>Блог финансовой свободы</Text>
      {fromCache && (
        <Text style={styles.cacheIndicator}>📦 Данные из кэша</Text>
      )}

      {posts.length === 0 ? (
        <Text style={styles.emptyText}>Нет постов</Text>
      ) : (
        posts.map((post) => {
          const date = post.createdAt 
            ? new Date(post.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
            : '';
          
          return (
            <View key={post.id} style={styles.postCard}>
              <View style={styles.postHeader}>
                <Text style={styles.postAuthor}>
                  {post.author?.name || 'Неизвестный автор'}
                </Text>
                {date && <Text style={styles.postDate}>{date}</Text>}
              </View>
              <Text style={styles.postContent}>{post.content}</Text>
              <View style={styles.postFooter}>
                <Text style={styles.postLikes}>
                  ❤️ {post.likes?.length || post._count?.likes || 0}
                </Text>
                <Text style={styles.postComments}>
                  💬 {post.comments?.length || post._count?.comments || 0}
                </Text>
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

// -------------------- ЭКРАН "ПРОФИЛЬ" --------------------
// Демонстрирует использование кастомного хука useProfile
function ProfileScreen() {
  const { profile, loading, error, fromCache, loadProfile } = useProfile();

  const onRefresh = () => {
    loadProfile();
  };

  if (loading && !profile) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Загрузка профиля...</Text>
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
      <Text style={styles.title}>Профиль</Text>
      {fromCache && (
        <Text style={styles.cacheIndicator}>📦 Данные из локального хранилища</Text>
      )}

      {profile ? (
        <View style={styles.profileCard}>
          <Text style={styles.profileName}>
            {profile.name || profile.email || 'Пользователь'}
          </Text>
          <Text style={styles.profileEmail}>{profile.email}</Text>
          <View style={styles.profileStatsRow}>
            <ProfileStat 
              label="Тема" 
              value={profile.theme === 'dark' ? 'Тёмная' : profile.theme === 'light' ? 'Светлая' : 'Системная'} 
            />
            <ProfileStat 
              label="Онбординг" 
              value={profile.onboardingCompleted ? '✓' : '✗'} 
            />
          </View>
        </View>
      ) : (
        <Text style={styles.emptyText}>Профиль не загружен</Text>
      )}
    </ScrollView>
  );
}

// -------------------- ВСПОМОГАТЕЛЬНЫЕ КОМПОНЕНТЫ --------------------
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

function ProfileStat({ label, value }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// -------------------- СТИЛИ --------------------
const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    paddingTop: 32,
  },
  screenContainer: {
    padding: 16,
    gap: 16,
    paddingBottom: 100,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '500',
    marginTop: 8,
  },
  loadingText: {
    marginTop: 12,
    color: '#6b7280',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  cacheIndicator: {
    fontSize: 12,
    color: '#10b981',
    marginBottom: 8,
  },
  emptyText: {
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 32,
  },
  summaryCard: {
    backgroundColor: '#1f2937',
    borderRadius: 16,
    padding: 20,
  },
  summaryLabel: {
    color: '#d1d5db',
    fontSize: 16,
  },
  summaryValue: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '700',
    marginVertical: 8,
  },
  summarySubtext: {
    color: '#9ca3af',
    fontSize: 14,
  },
  expenseCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    elevation: 1,
  },
  expenseTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  expenseMeta: {
    color: '#6b7280',
    fontSize: 14,
    marginTop: 4,
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
    alignItems: 'center',
    gap: 8,
  },
  categoryColorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '500',
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
  leaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    gap: 12,
  },
  leaderPosition: {
    fontSize: 20,
    fontWeight: '600',
    color: '#9ca3af',
    width: 32,
  },
  leaderName: {
    fontSize: 16,
    fontWeight: '500',
  },
  leaderScore: {
    color: '#6b7280',
    fontSize: 14,
    marginTop: 4,
  },
  postCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  postAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  postDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  postContent: {
    fontSize: 16,
    color: '#4b5563',
    lineHeight: 24,
  },
  postFooter: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  postLikes: {
    fontSize: 14,
    color: '#6b7280',
  },
  postComments: {
    fontSize: 14,
    color: '#6b7280',
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    gap: 16,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '600',
  },
  profileEmail: {
    color: '#6b7280',
    fontSize: 14,
  },
  profileStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  statLabel: {
    color: '#6b7280',
    fontSize: 12,
    marginTop: 4,
  },
  tabBar: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#e5e7eb',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
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
