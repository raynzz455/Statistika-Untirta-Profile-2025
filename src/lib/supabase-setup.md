# Supabase Setup Guide

## Step 1: Create Supabase Project
1. Go to https://supabase.com and sign up/login
2. Click "New Project"
3. Name: `statistika25`
4. Set a strong database password
5. Choose region: Southeast Asia (Singapore) or closest
6. Wait for project to be ready (~2 minutes)

## Step 2: Get Connection String
1. Go to Project Settings > Database
2. Find "Connection string" section
3. Copy the "Direct connection" URL (looks like):
   `postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`

## Step 3: Update .env
Replace the SQLite DATABASE_URL with Supabase:
```
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
```

## Step 4: Update Prisma Schema
In `prisma/schema.prisma`, change:
```
provider = "sqlite"  →  provider = "postgresql"
```

## Step 5: Push Schema & Seed
```bash
bun run db:push    # Create all tables in Supabase
bun run db:seed    # Seed initial data (users, students, articles, events, etc.)
```

## Step 6: Verify
```bash
curl http://localhost:3000/api/students
```
Should return student data from Supabase.

## Notes
- Supabase free tier: 500MB storage, 2GB bandwidth
- For production: use Connection Pooler URL (port 6543)
- Enable Row Level Security (RLS) in Supabase dashboard for production
- Consider adding Supabase Auth for production-grade authentication
