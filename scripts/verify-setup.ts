#!/usr/bin/env bun
// ============================================================================
// Statistika '25 — Setup Verification Script
// ============================================================================
// Tests that the database, auth, storage, and RLS are properly configured.
// Run after bash scripts/setup.sh to verify everything works.
//
// Usage:
//   bun run scripts/verify-setup.ts
// ============================================================================

import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

interface CheckResult {
  name: string
  status: 'pass' | 'fail' | 'warn'
  message: string
  details?: string[]
}

const results: CheckResult[] = []

function log(check: CheckResult) {
  results.push(check)
  const icon =
    check.status === 'pass' ? '✓' : check.status === 'fail' ? '✗' : '⚠'
  const color =
    check.status === 'pass'
      ? '\x1b[32m'
      : check.status === 'fail'
      ? '\x1b[31m'
      : '\x1b[33m'
  console.log(`${color}${icon}\x1b[0m ${check.name}: ${check.message}`)
  if (check.details) {
    check.details.forEach((d) => console.log(`    ${d}`))
  }
}

async function checkEnvVars() {
  console.log('\n=== STAGE 1: Environment Variables ===')
  const required = [
    'DATABASE_URL',
    'DIRECT_URL',
    'SESSION_SECRET',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
  ]
  const missing: string[] = []
  const placeholder: string[] = []

  for (const v of required) {
    const val = process.env[v] ?? ''
    if (!val) missing.push(v)
    else if (val.includes('YOUR_') || val.includes('REPLACE_WITH'))
      placeholder.push(v)
  }

  if (missing.length === 0 && placeholder.length === 0) {
    log({
      name: 'Env vars',
      status: 'pass',
      message: 'All 6 required env vars are set with real values',
    })
  } else {
    if (missing.length > 0) {
      log({
        name: 'Missing env vars',
        status: 'fail',
        message: `${missing.length} vars not set`,
        details: missing.map((m) => `- ${m}`),
      })
    }
    if (placeholder.length > 0) {
      log({
        name: 'Placeholder env vars',
        status: 'fail',
        message: `${placeholder.length} vars still have placeholder values`,
        details: placeholder.map((m) => `- ${m} (edit .env with real Supabase credentials)`),
      })
    }
  }
}

async function checkDbConnection() {
  console.log('\n=== STAGE 2: Database Connection ===')
  try {
    // Test connection by counting users
    const userCount = await db.user.count()
    log({
      name: 'DB connection',
      status: 'pass',
      message: `Connected to PostgreSQL — found ${userCount} users`,
    })
  } catch (e: any) {
    log({
      name: 'DB connection',
      status: 'fail',
      message: 'Cannot connect to PostgreSQL',
      details: [
        `Error: ${e.message?.slice(0, 100) || 'unknown'}`,
        'Check DATABASE_URL in .env',
        'Ensure Supabase project is running',
      ],
    })
  }
}

async function checkTables() {
  console.log('\n=== STAGE 3: Tables Exist ===')
  const expectedTables = [
    'User',
    'Student',
    'Article',
    'Series',
    'SeriesItem',
    'Dosen',
    'Tag',
    'ArticleTag',
    'Bookmark',
    'Like',
    'Event',
    'Gallery',
    'Rsvp',
    'Comment',
    'Follow',
    'Notification',
    'Message',
    'Aspirasi',
    'StudentPortfolio',
  ]

  const found: string[] = []
  const missing: string[] = []

  for (const t of expectedTables) {
    try {
      const model = (db as any)[t.charAt(0).toLowerCase() + t.slice(1)]
      if (model) {
        await model.count()
        found.push(t)
      } else {
        missing.push(t)
      }
    } catch {
      missing.push(t)
    }
  }

  if (missing.length === 0) {
    log({
      name: 'Tables',
      status: 'pass',
      message: `All ${expectedTables.length} tables exist and are queryable`,
    })
  } else {
    log({
      name: 'Tables',
      status: 'fail',
      message: `${missing.length}/${expectedTables.length} tables missing or inaccessible`,
      details: [
        ...missing.map((m) => `- Missing: ${m}`),
        'Run: bun run db:push',
      ],
    })
  }
}

async function checkSeedData() {
  console.log('\n=== STAGE 4: Seed Data ===')
  const checks = [
    { name: 'User', min: 3, model: 'user' as const },
    { name: 'Student', min: 12, model: 'student' as const },
    { name: 'Article', min: 4, model: 'article' as const },
    { name: 'Event', min: 4, model: 'event' as const },
    { name: 'Gallery', min: 6, model: 'gallery' as const },
    { name: 'Aspirasi', min: 20, model: 'aspirasi' as const },
    { name: 'Dosen', min: 3, model: 'dosen' as const },
    { name: 'StudentPortfolio', min: 12, model: 'studentPortfolio' as const },
  ]

  for (const c of checks) {
    try {
      const count = await (db as any)[c.model].count()
      const ok = count >= c.min
      log({
        name: c.name,
        status: ok ? 'pass' : 'warn',
        message: `${count} records (expected ≥ ${c.min})`,
      })
    } catch (e: any) {
      log({
        name: c.name,
        status: 'fail',
        message: 'Cannot query table',
        details: [e.message?.slice(0, 80) || 'unknown'],
      })
    }
  }
}

async function checkSupabaseAuth() {
  console.log('\n=== STAGE 5: Supabase Auth ===')
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey || url.includes('YOUR_')) {
    log({
      name: 'Supabase Auth',
      status: 'warn',
      message: 'Not configured (NEXT_PUBLIC_SUPABASE_URL is placeholder)',
      details: ['Custom session.ts will work as fallback for dev'],
    })
    return
  }

  try {
    // Test by fetching auth settings (public endpoint)
    const res = await fetch(`${url}/auth/v1/settings`, {
      headers: { apikey: anonKey },
    })
    if (res.ok) {
      const data: any = await res.json()
      const externalProviders = data?.external?.filter((p: any) => p.enabled).map((p: any) => p.id) || []
      log({
        name: 'Supabase Auth',
        status: 'pass',
        message: 'Auth service is reachable',
        details: [
          `Site URL: ${data?.site_url || 'n/a'}`,
          `External OAuth providers enabled: ${externalProviders.length > 0 ? externalProviders.join(', ') : 'none'}`,
        ],
      })
      if (externalProviders.length === 0) {
        log({
          name: 'OAuth providers',
          status: 'warn',
          message: 'No OAuth providers enabled yet',
          details: ['Configure in Supabase Dashboard → Authentication → Providers'],
        })
      }
    } else {
      log({
        name: 'Supabase Auth',
        status: 'fail',
        message: `Auth service returned ${res.status}`,
      })
    }
  } catch (e: any) {
    log({
      name: 'Supabase Auth',
      status: 'fail',
      message: 'Cannot reach Supabase Auth',
      details: [e.message?.slice(0, 100) || 'unknown'],
    })
  }
}

async function checkSupabaseStorage() {
  console.log('\n=== STAGE 6: Supabase Storage ===')
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey || url.includes('YOUR_')) {
    log({
      name: 'Supabase Storage',
      status: 'warn',
      message: 'Not configured (skipping)',
    })
    return
  }

  try {
    // List buckets (service role bypasses RLS)
    const res = await fetch(`${url}/storage/v1/bucket`, {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
    })
    if (res.ok) {
      const buckets: any[] = await res.json()
      const mahasiswaBucket = buckets.find((b) => b.name === 'mahasiswa-photos')

      if (mahasiswaBucket) {
        log({
          name: 'Storage bucket',
          status: 'pass',
          message: "Bucket 'mahasiswa-photos' exists",
          details: [
            `Public: ${mahasiswaBucket.public ? 'yes' : 'no (private ✓)'}`,
            `File size limit: ${mahasiswaBucket.file_size_limit ? (mahasiswaBucket.file_size_limit / 1024 / 1024).toFixed(1) + ' MB' : 'default'}`,
          ],
        })
      } else {
        log({
          name: 'Storage bucket',
          status: 'fail',
          message: "Bucket 'mahasiswa-photos' not found",
          details: [
            'Available buckets: ' + (buckets.length > 0 ? buckets.map((b) => b.name).join(', ') : 'none'),
            'Run: supabase/storage-policies.sql in SQL Editor',
          ],
        })
      }
    } else {
      log({
        name: 'Supabase Storage',
        status: 'fail',
        message: `Storage API returned ${res.status}`,
      })
    }
  } catch (e: any) {
    log({
      name: 'Supabase Storage',
      status: 'fail',
      message: 'Cannot reach Supabase Storage',
      details: [e.message?.slice(0, 100) || 'unknown'],
    })
  }
}

async function checkRLS() {
  console.log('\n=== STAGE 7: Row-Level Security ===')
  try {
    // Query pg_tables to check RLS status (requires direct connection)
    const rlsStatus: { tablename: string; rowsecurity: boolean }[] = await db.$queryRaw`
      SELECT tablename, rowsecurity
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `

    const enabled = rlsStatus.filter((t) => t.rowsecurity).map((t) => t.tablename)
    const disabled = rlsStatus.filter((t) => !t.rowsecurity).map((t) => t.tablename)

    if (enabled.length === 0) {
      log({
        name: 'RLS',
        status: 'fail',
        message: 'No tables have RLS enabled',
        details: ['Run: supabase/rls-policies.sql in SQL Editor'],
      })
    } else {
      log({
        name: 'RLS',
        status: disabled.length === 0 ? 'pass' : 'warn',
        message: `${enabled.length}/${enabled.length + disabled.length} tables have RLS enabled`,
        details:
          disabled.length > 0 ? [`RLS disabled on: ${disabled.join(', ')}`] : undefined,
      })
    }
  } catch (e: any) {
    log({
      name: 'RLS',
      status: 'warn',
      message: 'Cannot check RLS status',
      details: [e.message?.slice(0, 100) || 'unknown'],
    })
  }
}

async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('  Statistika \'25 — Setup Verification')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  await checkEnvVars()
  await checkDbConnection()
  await checkTables()
  await checkSeedData()
  await checkSupabaseAuth()
  await checkSupabaseStorage()
  await checkRLS()

  await db.$disconnect()

  // Summary
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('  SUMMARY')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  const pass = results.filter((r) => r.status === 'pass').length
  const warn = results.filter((r) => r.status === 'warn').length
  const fail = results.filter((r) => r.status === 'fail').length
  console.log(`  ✓ Pass: ${pass}    ⚠ Warn: ${warn}    ✗ Fail: ${fail}`)
  console.log('')

  if (fail > 0) {
    console.log('❌ Setup has failures — fix the ✗ items above')
    process.exit(1)
  } else if (warn > 0) {
    console.log('⚠ Setup is functional but has warnings — review the ⚠ items')
    process.exit(0)
  } else {
    console.log('✅ All checks passed — setup is complete and ready for production')
    process.exit(0)
  }
}

main().catch((e) => {
  console.error('Verification failed:', e)
  process.exit(1)
})
