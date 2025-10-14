require('dotenv').config();
const path = require('path');
const express = require('express');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();

const PORT = process.env.PORT || 3000;

// Express setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
  res.redirect('/posts');
});

// List posts
app.get('/posts', async (req, res) => {
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: 'desc' }
  });
  res.render('posts/index', { posts });
});

// New post form
app.get('/posts/new', (req, res) => {
  res.render('posts/new');
});

// Create post
app.post('/posts', async (req, res) => {
  const { title, content } = req.body;
  await prisma.post.create({ data: { title, content } });
  res.redirect('/posts');
});

// Show post
app.get('/posts/:id', async (req, res) => {
  const id = Number(req.params.id);
  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) return res.status(404).send('Post not found');
  res.render('posts/show', { post });
});

// Edit post form
app.get('/posts/:id/edit', async (req, res) => {
  const id = Number(req.params.id);
  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) return res.status(404).send('Post not found');
  res.render('posts/edit', { post });
});

// Update post (using POST to avoid method-override dependency)
app.post('/posts/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { title, content } = req.body;
  await prisma.post.update({ where: { id }, data: { title, content } });
  res.redirect(`/posts/${id}`);
});

// Delete post (using POST to avoid method-override dependency)
app.post('/posts/:id/delete', async (req, res) => {
  const id = Number(req.params.id);
  await prisma.post.delete({ where: { id } });
  res.redirect('/posts');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


