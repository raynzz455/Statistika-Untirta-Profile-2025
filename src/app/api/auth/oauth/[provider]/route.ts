// ============================================================================
// GET /api/auth/oauth/[provider] — Initiate OAuth sign-in
// ============================================================================
// Triggers the OAuth flow for the specified provider (google, github, etc).
// Redirects to Supabase Auth, which then redirects back to /auth/callback
// after the user consents.
//
// Usage:
//   <a href="/api/auth/oauth/google">Sign in with Google</a>
//   fetch('/api/auth/oauth/github').then(r => r.json()).then(d => window.location = d.url)
//
// After successful auth, user is redirected to /auth/callback?code=... which
// exchanges the code for a session (see src/app/auth/callback/route.ts).
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { supabaseBrowser } from '@/lib/supabase-browser'

const SUPPORTED_PROVIDERS = ['google', 'github', 'apple', 'discord', 'azure', 'facebook', 'gitlab']

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params

  // Validate provider
  if (!SUPPORTED_PROVIDERS.includes(provider)) {
    return NextResponse.json(
      { error: `Provider ${provider} tidak didukung. Yang didukung: ${SUPPORTED_PROVIDERS.join(', ')}` },
      { status: 400 }
    )
  }

  // Get redirect target (default to home)
  const { searchParams } = new URL(req.url)
  const next = searchParams.get('next') ?? '/'

  // Validate next URL (prevent open redirect)
  const allowedNext = next.startsWith('/') && !next.startsWith('//') ? next : '/'

  // Get origin (works for both localhost and production)
  const origin = req.nextUrl.origin

  try {
    const supabase = supabaseBrowser
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: provider as any,
      options: {
        redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(allowedNext)}`,
      },
    })

    if (error) {
      console.error(`[oauth/${provider}] error:`, error.message)
      return NextResponse.redirect(
        `${origin}/#/login?error=${encodeURIComponent(error.message)}`
      )
    }

    // Redirect to Supabase OAuth URL (Google/GitHub/etc)
    if (data?.url) {
      return NextResponse.redirect(data.url)
    }

    return NextResponse.json(
      { error: 'Tidak ada URL OAuth yang dikembalikan.' },
      { status: 500 }
    )
  } catch (e: any) {
    console.error(`[oauth/${provider}] exception:`, e?.message)
    return NextResponse.redirect(
      `${origin}/#/login?error=${encodeURIComponent('Gagal memulai OAuth flow')}`
    )
  }
}
