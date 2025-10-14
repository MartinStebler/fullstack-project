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
2. Create a Neon database (prod + dev branch):
   - In Neon, signup then create a project and database (this is your prod/main branch).
   - Create a second branch in Neon called `dev` (recommended for local development).
   - Copy BOTH pooled connection strings with TLS:
     - Prod (main) URL → used on Render later
     - Dev (branch) URL → used locally in `.env`
     ```
     postgresql://USER:PASSWORD@HOST:PORT/DB?sslmode=require&pgbouncer=true&connection_limit=1
     ```
3. Create `.env` at the project root with the DEV branch URL:
   ```bash
   DATABASE_URL="postgresql://USER:PASSWORD@DEV_HOST:PORT/DB?sslmode=require&pgbouncer=true&connection_limit=1"
   DIRECT_URL="postgresql://USER:PASSWORD@DEV_HOST:PORT/DB?sslmode=require" (non pooled version)
   ```
4. Initialize Prisma and the DB schema (applies to DEV branch URL):
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
   - Start command: `npm start` (or `npm run prisma:deploy && node index.js`)
   - Build: Render runs `npm install` (then `postinstall` runs `prisma generate`)
4. Environment Variables (Neon + Prisma recommended):
   - `DATABASE_URL` = pooled URL for the app runtime
   - `DIRECT_URL` = direct (non-pooled) URL for migrations
   
   Example:
   ```
   DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DB?sslmode=require&pgbouncer=true&connection_limit=1
   DIRECT_URL=postgresql://USER:PASSWORD@HOST:PORT/DB?sslmode=require
   ```
   Note: `DIRECT_URL` is used by Prisma Migrate; your app uses `DATABASE_URL`.

## 4) Auto-Deploys
- Enable Auto-Deploys in the service settings so pushes to `main` redeploy automatically.

## Workflow: develop → migrate → deploy
- Change schema: edit `prisma/schema.prisma`.
- Apply locally to DEV DB and create migration files:
  ```bash
  npx prisma migrate dev --name <change-name>
  ```
- Verify locally (and via `npx prisma studio` if needed).
- Commit and push (include `prisma/migrations/**`).
- Deploy: Render pulls your code and automatically runs:
  - `postinstall` → `prisma generate`
  - `prestart` → `prisma migrate deploy` (applies committed migrations to PROD DB using `DIRECT_URL` if set)
- If no new migrations exist, deploy continues without changes.

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
