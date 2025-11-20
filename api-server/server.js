// Простой Express API сервер для подключения к Neon PostgreSQL
// Используется как API gateway для мобильного приложения

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Устанавливаем DATABASE_URL до импорта Prisma
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "postgresql://neondb_owner:npg_W8KC1GJjmRIy@ep-blue-cake-abtejvo4-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
}

const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();

const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors()); // Разрешаем CORS для мобильного приложения
app.use(express.json());

// Тестовый эндпоинт для проверки подключения к БД
app.get('/api/test-db', async (req, res) => {
  try {
    const userCount = await prisma.user.count();
    res.json({ 
      success: true, 
      message: 'Database connected successfully',
      userCount 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ========== EXPENSES API ==========
// GET /api/expenses - получить все расходы (для теста, без авторизации)
app.get('/api/expenses', async (req, res) => {
  try {
    const expenses = await prisma.expense.findMany({
      include: { category: true },
      orderBy: { spentAt: 'desc' },
      take: 50, // Ограничиваем для теста
    });
    res.json(expenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/expenses - создать новый расход
app.post('/api/expenses', async (req, res) => {
  try {
    const { amount, currency = 'RUB', note, categoryId, userId } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // Для теста используем первого пользователя, если userId не указан
    let finalUserId = userId;
    if (!finalUserId) {
      const firstUser = await prisma.user.findFirst();
      if (!firstUser) {
        return res.status(400).json({ error: 'No users found. Please create a user first.' });
      }
      finalUserId = firstUser.id;
    }

    const expense = await prisma.expense.create({
      data: {
        userId: finalUserId,
        categoryId: categoryId || null,
        amount: parseFloat(amount),
        currency,
        note: note || null,
      },
      include: { category: true },
    });

    res.status(201).json(expense);
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/expenses/:id - удалить расход
app.delete('/api/expenses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.expense.delete({
      where: { id },
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== CATEGORIES API ==========
// GET /api/categories - получить все категории
app.get('/api/categories', async (req, res) => {
  try {
    // Для теста получаем категории первого пользователя
    const firstUser = await prisma.user.findFirst();
    if (!firstUser) {
      return res.json([]);
    }

    const categories = await prisma.category.findMany({
      where: { userId: firstUser.id },
      orderBy: { name: 'asc' },
    });
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/categories - создать новую категорию
app.post('/api/categories', async (req, res) => {
  try {
    const { name, color = '#3B82F6' } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }

    // Для теста используем первого пользователя
    const firstUser = await prisma.user.findFirst();
    if (!firstUser) {
      return res.status(400).json({ error: 'No users found. Please create a user first.' });
    }

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        color,
        userId: firstUser.id,
      },
    });

    res.status(201).json(category);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: error.message || 'Category already exists' });
  }
});

// ========== LEADERBOARD API ==========
// GET /api/leaderboard - получить лидерборд
app.get('/api/leaderboard', async (req, res) => {
  try {
    // Получаем всех пользователей и их расходы
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, image: true },
    });

    const totals = await prisma.expense.groupBy({
      by: ['userId'],
      _sum: { amount: true },
    });

    const board = totals
      .map(t => {
        const user = users.find(u => u.id === t.userId);
        return {
          userId: t.userId,
          total: t._sum.amount || 0,
          name: user?.name || user?.email || 'Unknown',
          image: user?.image || null,
        };
      })
      .sort((a, b) => Number(a.total) - Number(b.total)); // Меньше трат = лучше

    res.json(board);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== POSTS API ==========
// GET /api/posts - получить посты
app.get('/api/posts', async (req, res) => {
  try {
    const posts = await prisma.post.findMany({
      include: {
        author: {
          select: { id: true, name: true, image: true },
        },
        likes: {
          include: {
            user: {
              select: { id: true, name: true },
            },
          },
        },
        comments: {
          include: {
            author: {
              select: { id: true, name: true, image: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        _count: {
          select: { likes: true, comments: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    res.json({ posts });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/posts - создать пост
app.post('/api/posts', async (req, res) => {
  try {
    const { content, imageUrl } = req.body;
    
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Content is required' });
    }

    // Для теста используем первого пользователя
    const firstUser = await prisma.user.findFirst();
    if (!firstUser) {
      return res.status(400).json({ error: 'No users found. Please create a user first.' });
    }

    const post = await prisma.post.create({
      data: {
        content: content.trim(),
        imageUrl: imageUrl || null,
        authorId: firstUser.id,
      },
      include: {
        author: {
          select: { id: true, name: true, image: true },
        },
        likes: true,
        comments: true,
        _count: {
          select: { likes: true, comments: true },
        },
      },
    });

    res.status(201).json({ post });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== PROFILE API ==========
// GET /api/profile - получить профиль первого пользователя (для теста)
app.get('/api/profile', async (req, res) => {
  try {
    const firstUser = await prisma.user.findFirst({
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        theme: true,
      },
    });

    if (!firstUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(firstUser);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/profile - обновить профиль
app.put('/api/profile', async (req, res) => {
  try {
    const { name, image, theme } = req.body;

    // Для теста используем первого пользователя
    const firstUser = await prisma.user.findFirst();
    if (!firstUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name || null;
    if (image !== undefined) updateData.image = image || null;
    if (theme !== undefined) updateData.theme = theme || 'system';

    const updatedUser = await prisma.user.update({
      where: { id: firstUser.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        theme: true,
      },
    });

    res.json({
      message: 'Profile updated',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: error.message });
  }
});

// Запуск сервера
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 API Server running on http://0.0.0.0:${PORT}`);
  console.log(`📱 Accessible from mobile at http://192.168.0.20:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

