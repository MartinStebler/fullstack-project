# Authentication Setup Guide

This guide walks through adding simple authentication to the Express + Prisma + Neon project.

## Overview

We'll implement:
- User registration (sign up)
- User login
- User logout
- Protected routes (require login)
- Session-based authentication (in-memory sessions)

## Step 1: Install Dependencies

Add authentication packages:

```bash
npm install express-session bcrypt
```

## Step 2: Update Prisma Schema

Add a `User` model to `prisma/schema.prisma`:

```prisma
model User {
  id           Int      @id @default(autoincrement())
  email        String   @unique
  passwordHash String
  createdAt    DateTime @default(now())
  posts        Post[]
}

model Post {
  id        Int      @id @default(autoincrement())
  title     String
  tag       String @default("uncategorized")
  content   String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  userId    Int?
  user      User?   @relation(fields: [userId], references: [id])
}
```

Run migration:
```bash
npx prisma migrate dev --name add-user-auth
```

## Step 3: Environment Variables

Add to `.env`:
```bash
SESSION_SECRET="your-secret-key-here-change-in-production"
```

For production (Render), add `SESSION_SECRET` in Render's environment variables.

## Step 4: Configure Express Session

In `index.js`, add session middleware after `express.urlencoded`:

```javascript
const session = require('express-session');
const bcrypt = require('bcrypt');

// ... existing code ...

app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  }
}));

// Make currentUser available to all views
app.use((req, res, next) => {
  res.locals.currentUser = req.session.userId ? { id: req.session.userId } : null;
  next();
});
```

## Step 5: Create Authentication Middleware

Add a helper function to protect routes (before routes):

```javascript
// Require authentication middleware
const requireAuth = async (req, res, next) => {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  next();
};
```

## Step 6: Create Authentication Routes

Add these routes before your existing post routes:

```javascript
// Registration
app.get('/register', (req, res) => {
  res.render('auth/register');
});

app.post('/register', async (req, res) => {
  const { email, password } = req.body;
  
  // Basic validation
  if (!email || !password) {
    return res.render('auth/register', { error: 'Email and password required' });
  }
  
  if (password.length < 6) {
    return res.render('auth/register', { error: 'Password must be at least 6 characters' });
  }
  
  try {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.render('auth/register', { error: 'Email already registered' });
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Create user
    const user = await prisma.user.create({
      data: { email, passwordHash }
    });
    
    // Auto-login after registration
    req.session.userId = user.id;
    res.redirect('/posts');
  } catch (error) {
    res.render('auth/register', { error: 'Registration failed' });
  }
});

// Login
app.get('/login', (req, res) => {
  res.render('auth/login');
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.render('auth/login', { error: 'Email and password required' });
  }
  
  try {
    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.render('auth/login', { error: 'Invalid email or password' });
    }
    
    // Check password
    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.render('auth/login', { error: 'Invalid email or password' });
    }
    
    // Set session
    req.session.userId = user.id;
    res.redirect('/posts');
  } catch (error) {
    res.render('auth/login', { error: 'Login failed' });
  }
});

// Logout
app.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});
```

## Step 7: Protect Post Routes

Wrap your existing post routes with `requireAuth`:

```javascript
// List posts (protected)
app.get('/posts', requireAuth, async (req, res) => {
  // ... existing code ...
});

// New post form (protected)
app.get('/posts/new', requireAuth, (req, res) => {
  // ... existing code ...
});

// Create post (protected)
app.post('/posts', requireAuth, async (req, res) => {
  // ... existing code ...
});

// Show post (protected)
app.get('/posts/:id', requireAuth, async (req, res) => {
  // ... existing code ...
});

// Edit post form (protected)
app.get('/posts/:id/edit', requireAuth, async (req, res) => {
  // ... existing code ...
});

// Update post (protected)
app.post('/posts/:id', requireAuth, async (req, res) => {
  // ... existing code ...
});

// Delete post (protected)
app.post('/posts/:id/delete', requireAuth, async (req, res) => {
  // ... existing code ...
});
```

## Step 8: Create Login View

Create `views/auth/login.ejs`:

```ejs
<% const title = 'Login'; %>
<h2 class="text-xl font-semibold mb-4">Login</h2>

<% if (typeof error !== 'undefined') { %>
  <div class="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
    <%= error %>
  </div>
<% } %>

<form action="/login" method="post" class="space-y-4">
  <div>
    <label class="block text-sm font-medium text-gray-700">Email</label>
    <input type="email" name="email" required 
           class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
  </div>
  <div>
    <label class="block text-sm font-medium text-gray-700">Password</label>
    <input type="password" name="password" required 
           class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
  </div>
  <div class="flex items-center gap-3">
    <button type="submit" class="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500">
      Login
    </button>
    <a href="/register" class="text-sm text-gray-600 hover:underline">Register</a>
  </div>
</form>
```

## Step 9: Create Register View

Create `views/auth/register.ejs`:

```ejs
<% const title = 'Register'; %>
<h2 class="text-xl font-semibold mb-4">Register</h2>

<% if (typeof error !== 'undefined') { %>
  <div class="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
    <%= error %>
  </div>
<% } %>

<form action="/register" method="post" class="space-y-4">
  <div>
    <label class="block text-sm font-medium text-gray-700">Email</label>
    <input type="email" name="email" required 
           class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
  </div>
  <div>
    <label class="block text-sm font-medium text-gray-700">Password</label>
    <input type="password" name="password" required 
           class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
    <p class="mt-1 text-xs text-gray-500">Minimum 6 characters</p>
  </div>
  <div class="flex items-center gap-3">
    <button type="submit" class="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500">
      Register
    </button>
    <a href="/login" class="text-sm text-gray-600 hover:underline">Login</a>
  </div>
</form>
```

## Step 10: Update Layout Header

Update `views/layout.ejs` header to show login/logout:

```ejs
<header class="mb-6 flex items-center justify-between">
  <a href="/posts" class="text-2xl font-bold tracking-tight text-gray-900">Posts</a>
  <div class="flex items-center gap-4">
    <% if (typeof currentUser !== 'undefined' && currentUser) { %>
      <form action="/logout" method="post" class="inline">
        <button type="submit" class="text-sm text-gray-600 hover:underline">Logout</button>
      </form>
      <a href="/posts/new" class="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500">
        New Post
      </a>
    <% } else { %>
      <a href="/login" class="text-sm text-gray-600 hover:underline">Login</a>
      <a href="/register" class="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500">
        Register
      </a>
    <% } %>
  </div>
</header>
```

## Step 11: Update Root Route

Update the root route to redirect to login if not authenticated:

```javascript
app.get('/', (req, res) => {
  if (req.session.userId) {
    res.redirect('/posts');
  } else {
    res.redirect('/login');
  }
});
```

## Step 12: Testing

1. Start dev server: `npm run dev`
2. Visit `/register` and create an account
3. You should be automatically logged in and redirected to `/posts`
4. Try accessing `/posts` without logging in (should redirect to `/login`)
5. Test logout
6. Test login with existing credentials

## Production Deployment

1. Add `SESSION_SECRET` environment variable in Render
2. Generate a secure secret: `openssl rand -base64 32`
3. Set it in Render's environment variables
4. Redeploy

## Notes

- Sessions are stored in memory (lost on server restart)
- For production, consider using `connect-pg-simple` for persistent sessions
- Passwords are hashed with bcrypt (10 salt rounds)
- Basic validation only (email format, password length)
- No email verification or password reset (can be added later)

