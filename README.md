# Fullstack Project (Express + EJS + Prisma + Postgres)

Simple CRUD app using Express, EJS, Prisma, and Postgres. Run locally and deploy to Render using a Neon database.

## Stack
- Node/Express (EJS views)
- Prisma ORM
- Postgres (Neon in prod, any Postgres for dev)

## Prerequisites
- Node 18+ (or 20.x)
- GitHub account
- Neon account (Postgres, free)
- Render account (hosting, free)

## 1) Local Setup
1. Clone & install:
   ```bash
   git clone <your-repo-url>
   cd fullstack-project
   npm install
   ```
2. Create a Neon database:
   - In Neon, signup then create a project and database.
   - Copy the pooled connection string with TLS, e.g.:
     ```
     postgresql://USER:PASSWORD@HOST:PORT/DB?sslmode=require&pgbouncer=true&connection_limit=1
     ```
3. Create `.env` at the project root:
   ```bash
   DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DB?sslmode=require&pgbouncer=true&connection_limit=1"
   ```
4. Initialize Prisma and the DB schema:
   ```bash
   npx prisma migrate dev --name init
   ```
5. Run the app:
   ```bash
   npm run dev
   ```
   Visit http://localhost:3000/posts

Optional:
- Prisma Studio --> Visual Database Viewer:
  ```bash
  npx prisma studio
  ```

## 2) Push to GitHub
1. Commit Prisma files (and ignore `.env`):
   - Commit `prisma/schema.prisma` and `prisma/migrations/**`
   - `.env` should NOT be committed
2. Create a GitHub repo and push:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

## 3) Deploy on Render (Web Service)
1. Connect the Render GitHub App to your GitHub account/repo (https://github.com/apps/render) and grant access to this repo.
2. In Render, create a Web Service and connect your GitHub repo.
3. Settings:
   - Branch: `main`
   - Start command: `npm start`
   - Build: Render runs `npm install` (then `postinstall` runs `prisma generate`)
4. Environment Variables:
   - `DATABASE_URL` = your Neon pooled URL (copy snippet)

## 4) Auto-Deploys
- Enable Auto-Deploys in the service settings so pushes to `main` redeploy automatically.

## Use separate Neon branches for Dev and Prod (recommended)
- In Neon: create a new branch (e.g., `dev`) from your main branch.
- Local development: set `.env` to the dev branch connection string.
  ```bash
  # .env (local)
  DATABASE_URL="postgresql://USER:PASSWORD@DEV_HOST:PORT/DB?sslmode=require&pgbouncer=true&connection_limit=1"
  ```
- Production (Render): set the Web Service `DATABASE_URL` to the main/prod branch connection string in the Render dashboard.
- Workflow:
  1) Develop locally against the dev branch, use the following command when you changed to schema → `npx prisma migrate dev`
  2) Commit `prisma/migrations/**`
  3) Push to GitHub → Render deploy runs `prisma migrate deploy` against prod URL

## Scripts
- `npm run dev` — start with nodemon
- `npm start` — start server (production)
- `npm run prisma:migrate` — `prisma migrate dev`
- `npm run prisma:deploy` — `prisma migrate deploy`
- `npm run prisma:generate` — `prisma generate`

## Troubleshooting
- EJS: Ensure views include `views/partials/head.ejs` and `views/partials/foot.ejs`.
- Prisma/DB:
  - Verify `DATABASE_URL` and TLS params
  - Ensure migrations are committed; check logs for `migrate deploy`
- Render 500s: Check Render logs for DB connection/migration issues.
