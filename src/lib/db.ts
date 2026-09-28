import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Prisma logging configuration:
// - Production: only errors + warnings (no query logs, prevents log noise)
// - Development: errors + warnings (query logs disabled by default to reduce noise
//   from DEALLOCATE ALL calls when using ?pgbouncer=true with Supabase pooler)
// - To enable query logs for debugging: set PRISMA_LOG_QUERIES=true in .env
const isProduction = process.env.NODE_ENV === 'production'
const logQueries = process.env.PRISMA_LOG_QUERIES === 'true'

const logLevel = logQueries
  ? ['query', 'error', 'warn']
  : ['error', 'warn']

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: logLevel,
  })

if (!isProduction) globalForPrisma.prisma = db
