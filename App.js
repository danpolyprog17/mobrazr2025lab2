// Главный файл приложения React Native (Expo).
// Макет мобильного финансового трекера: обзоры расходов, категории, лидерборд, блог и профиль.

import { StatusBar } from 'expo-status-bar';
import React, { useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

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

const MOCK_LEADERBOARD = [
  { id: 1, name: 'Анна', score: 92, trend: '+4%' },
  { id: 2, name: 'Денис', score: 88, trend: '+1%' },
  { id: 3, name: 'Марина', score: 73, trend: '-2%' },
  { id: 4, name: 'Лев', score: 67, trend: '+3%' },
];

const MOCK_POSTS = [
  {
    id: 1,
    title: 'Как начать копить с нуля',
    excerpt:
      'Разбираемся, как формировать «подушку» безопасности, даже если бюджет ограничен.',
  },
  {
    id: 2,
    title: '5 привычек осознанного потребления',
    excerpt: 'Советы, которые помогают снижать импульсивные траты каждый день.',
  },
];

const PROFILE = {
  name: 'Екатерина Смирнова',
  role: 'Продуктовый дизайнер',
  streak: 12,
  savingsGoal: '450 000 ₽',
  completedTasks: 8,
};

// -------------------- ГЛАВНЫЙ КОМПОНЕНТ ПРИЛОЖЕНИЯ --------------------
export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const summary = useMemo(() => {
    const total = MOCK_EXPENSES.reduce((acc, exp) => acc + exp.amount, 0);
    const limit = MOCK_CATEGORIES.reduce((acc, cat) => acc + cat.limit, 0);
    const spent = MOCK_CATEGORIES.reduce((acc, cat) => acc + cat.spent, 0);
    const saved = limit - spent;
    return { total, saved };
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

// -------------------- ЭКРАНЫ --------------------
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

      <Text style={styles.sectionTitle}>Недавние расходы</Text>
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

function LeaderboardScreen() {
  return (
    <ScrollView contentContainerStyle={styles.screenContainer}>
      <Text style={styles.title}>Лидерборд экономии</Text>
      {MOCK_LEADERBOARD.map((user, index) => (
        <View key={user.id} style={styles.leaderCard}>
          <Text style={styles.leaderPosition}>{index + 1}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.leaderName}>{user.name}</Text>
            <Text style={styles.leaderScore}>Баллы: {user.score}</Text>
          </View>
          <Text style={styles.leaderTrend}>{user.trend}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

function BlogScreen() {
  return (
    <ScrollView contentContainerStyle={styles.screenContainer}>
      <Text style={styles.title}>Блог финансовой свободы</Text>
      {MOCK_POSTS.map((post) => (
        <View key={post.id} style={styles.postCard}>
          <Text style={styles.postTitle}>{post.title}</Text>
          <Text style={styles.postExcerpt}>{post.excerpt}</Text>
          <Text style={styles.postLink}>Читать дальше →</Text>
        </View>
      ))}
    </ScrollView>
  );
}

function ProfileScreen() {
  return (
    <ScrollView contentContainerStyle={styles.screenContainer}>
      <Text style={styles.title}>Профиль</Text>
      <View style={styles.profileCard}>
        <Text style={styles.profileName}>{PROFILE.name}</Text>
        <Text style={styles.profileRole}>{PROFILE.role}</Text>
        <View style={styles.profileStatsRow}>
          <ProfileStat label="Серия дней" value={`${PROFILE.streak}`} />
          <ProfileStat label="Цель" value={PROFILE.savingsGoal} />
          <ProfileStat label="Задачи" value={`${PROFILE.completedTasks}/10`} />
        </View>
        <TouchableOpacity style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Редактировать профиль</Text>
        </TouchableOpacity>
      </View>
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
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '500',
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
  categoryTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  categoryAmount: {
    color: '#6b7280',
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
  },
  leaderName: {
    fontSize: 16,
    fontWeight: '500',
  },
  leaderScore: {
    color: '#6b7280',
  },
  leaderTrend: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10b981',
  },
  postCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  postTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  postExcerpt: {
    color: '#4b5563',
  },
  postLink: {
    color: '#2563eb',
    fontWeight: '500',
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
  profileRole: {
    color: '#6b7280',
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
  },
  primaryButton: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '600',
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
