# Database Setup Guide

## Step-by-Step Database Setup

### Step 1: Run Database Migration

First, create the database tables by running the migration:

```bash
npm run prisma:migrate
```

This will:
- Generate Prisma Client
- Create all tables (User, Product, Order)
- Create all enums and relationships

**If you get a migration name prompt, enter:** `init` or just press Enter.

### Step 2: Seed the Database

After migrations are complete, seed the database with sample products:

```bash
npm run prisma:seed
```

This will create 8 sample products in your database.

### Step 3: Verify Setup (Optional)

Open Prisma Studio to view your database:

```bash
npm run prisma:studio
```

This opens a GUI at `http://localhost:5555` where you can view and manage your data.

---

## Quick Setup (All at Once)

```bash
# 1. Migrate database
npm run prisma:migrate

# 2. Seed products
npm run prisma:seed

# 3. (Optional) Open Prisma Studio
npm run prisma:studio
```

---

## Troubleshooting

### Error: "Table does not exist"

**Solution:** Run migrations first:
```bash
npm run prisma:migrate
```

### Error: "Prisma Client not generated"

**Solution:** Generate Prisma Client:
```bash
npm run prisma:generate
```

### Error: "Connection to database failed"

**Solution:** Check your `.env` file and ensure:
1. `DATABASE_URL` is correct
2. PostgreSQL is running
3. Database exists

---

## Database Schema Overview

After migration, you'll have:

- **User** table - User accounts with authentication
- **Product** table - Product catalog
- **Order** table - Customer orders

All tables will be created with proper relationships and indexes.

