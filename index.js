require('dotenv').config();
const path = require('path');
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();

const PORT = process.env.PORT || 3000;

// Express setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layout');
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Sessions (in-memory for simplicity)
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000
  }
}));

// Expose currentUser to views
app.use((req, res, next) => {
  res.locals.currentUser = req.session.userId ? { id: req.session.userId } : null;
  next();
});

// Auth guard
const requireAuth = (req, res, next) => {
  if (!req.session.userId) return res.redirect('/login');
  next();
};

// Routes
app.get('/', (req, res) => {
  res.redirect('/posts');
});

// Auth routes
app.get('/register', (req, res) => {
  res.render('auth/register');
});

app.post('/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.render('auth/register', { error: 'Email and password required' });
  if (password.length < 6) return res.render('auth/register', { error: 'Password must be at least 6 characters' });
  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.render('auth/register', { error: 'Email already registered' });
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { email, passwordHash } });
    req.session.userId = user.id;
    res.redirect('/posts');
  } catch (e) {
    res.render('auth/register', { error: 'Registration failed' });
  }
});

app.get('/login', (req, res) => {
  res.render('auth/login');
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.render('auth/login', { error: 'Email and password required' });
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.render('auth/login', { error: 'Invalid email or password' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.render('auth/login', { error: 'Invalid email or password' });
    req.session.userId = user.id;
    res.redirect('/posts');
  } catch (e) {
    res.render('auth/login', { error: 'Login failed' });
  }
});

app.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

// List posts
app.get('/posts', async (req, res) => {
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: 'desc' }
  });
  res.render('posts/index', { posts });
});


// Show post
app.get('/posts/:id', requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) return res.status(404).send('Post not found');
  res.render('posts/show', { post });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


