# Quick Setup Guide

## Step 1: Install Dependencies

```bash
npm install
```

This will install all packages including Prisma CLI.

## Step 2: Connect Schema to Database

After installing dependencies, run:

```bash
npm run prisma:migrate
```

Or use direct command:

```bash
npx prisma migrate dev --schema=src/prisma/schema.prisma --name init
```

## Troubleshooting

If you still get errors, make sure:

1. **Node.js is installed** (v18 or higher):
   ```bash
   node --version
   ```

2. **npm is working**:
   ```bash
   npm --version
   ```

3. **Delete node_modules and reinstall** (if issues persist):
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

4. **Check your .env file exists** with DATABASE_URL:
   ```bash
   cp env.example .env
   ```
   Then edit `.env` and update `DATABASE_URL` with your PostgreSQL connection string.

