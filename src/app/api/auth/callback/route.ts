import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const type = searchParams.get('type')

  const supabase = await createClient()

  // Handle email confirmation callback
  if (type === 'email' && code) {
    try {
      // Exchange code for session using verifyOtp
      // Note: Email is required by Supabase API and is validated server-side
      // against the code to prevent mismatched verifications
      const { data, error } = await supabase.auth.verifyOtp({
        type: 'email',
        token: code,
        email: searchParams.get('email') || '',
      })

      if (error || !data.session) {
        console.error('Email verification failed:', error?.message)
        return NextResponse.redirect(
          new URL('/login?error=invalid_verification_code', request.url)
        )
      }

      // Session is now established in cookies via Supabase
      // Redirect to jobs page on successful verification
      return NextResponse.redirect(new URL('/jobs', request.url))
    } catch (err) {
      console.error('Auth callback error:', err)
      return NextResponse.redirect(
        new URL('/login?error=verification_failed', request.url)
      )
    }
  }

  // Handle password recovery callback (future implementation)
  if (type === 'recovery' && code) {
    return NextResponse.redirect(
      new URL(`/auth/reset-password?code=${code}`, request.url)
    )
  }

  // No valid callback type
  return NextResponse.redirect(new URL('/login', request.url))
}
