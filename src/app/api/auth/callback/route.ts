import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/jobs'

  // Sanitise the redirect destination to prevent open redirects
  const redirectTo = new URL(
    next.startsWith('/') && !next.startsWith('//') ? next : '/jobs',
    origin
  )

  const supabase = await createClient()

  // PKCE flow — preferred by newer Supabase clients
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      if (type === 'recovery') {
        return NextResponse.redirect(new URL('/reset-password', origin))
      }
      return NextResponse.redirect(redirectTo)
    }
    console.error('Auth callback: code exchange failed')
    return NextResponse.redirect(new URL('/login?error=auth_callback_failed', origin))
  }

  const ALLOWED_OTP_TYPES = ['signup', 'email', 'recovery', 'magiclink'] as const
  type OtpType = typeof ALLOWED_OTP_TYPES[number]

  // Legacy token_hash flow — email confirmation, magic link
  if (tokenHash && type && ALLOWED_OTP_TYPES.includes(type as OtpType)) {
    const { error } = await supabase.auth.verifyOtp({
      type: type as OtpType,
      token_hash: tokenHash,
    })
    if (!error) {
      if (type === 'recovery') {
        return NextResponse.redirect(new URL('/reset-password', origin))
      }
      return NextResponse.redirect(redirectTo)
    }
    console.error('Auth callback: token_hash verification failed')
  }

  return NextResponse.redirect(new URL('/login?error=auth_callback_failed', origin))
}
