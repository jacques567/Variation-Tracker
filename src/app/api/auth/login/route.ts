import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'

const MAX_LOGIN_ATTEMPTS = 5
const LOCKOUT_DURATION_MINUTES = 15

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const rateLimitDb = await createServiceRoleClient()

    // Check if contractor exists and if they're rate-limited (use service role to bypass RLS)
    const { data: contractor, error: fetchError } = await rateLimitDb
      .from('contractors')
      .select('id, login_attempt_count, login_attempt_reset_at')
      .eq('email', email)
      .maybeSingle()

    if (fetchError) {
      console.error('Contractor fetch error:', {
        code: fetchError.code,
        message: fetchError.message,
        status: (fetchError as any).status,
      })
      if (fetchError.code !== 'PGRST116') {
        return NextResponse.json(
          { error: 'Database error' },
          { status: 500 }
        )
      }
    }

    if (!contractor) {
      console.log('No contractor found for email:', email)
    } else {
      console.log('Contractor found:', {
        id: contractor.id,
        login_attempt_count: contractor.login_attempt_count,
        login_attempt_reset_at: contractor.login_attempt_reset_at,
      })
    }

    // Check if account is rate-limited
    if (contractor) {
      const resetAt = contractor.login_attempt_reset_at
        ? new Date(contractor.login_attempt_reset_at)
        : null

      if (
        contractor.login_attempt_count >= MAX_LOGIN_ATTEMPTS &&
        resetAt &&
        resetAt > new Date()
      ) {
        const minutesRemaining = Math.ceil(
          (resetAt.getTime() - new Date().getTime()) / 60000
        )
        return NextResponse.json(
          {
            error: `Account temporarily locked. Try again in ${minutesRemaining} minute${minutesRemaining !== 1 ? 's' : ''}.`,
            locked: true,
          },
          { status: 429 }
        )
      }

      // Reset counter if lockout period has expired
      if (resetAt && resetAt <= new Date()) {
        await rateLimitDb
          .from('contractors')
          .update({
            login_attempt_count: 0,
            login_attempt_reset_at: null,
          })
          .eq('id', contractor.id)
      }
    }

    // Attempt authentication
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    // If auth failed, increment attempt counter
    if (authError) {
      if (contractor) {
        const newAttemptCount = contractor.login_attempt_count + 1
        const resetAt = new Date()
        resetAt.setMinutes(resetAt.getMinutes() + LOCKOUT_DURATION_MINUTES)

        await rateLimitDb
          .from('contractors')
          .update({
            login_attempt_count: newAttemptCount,
            login_attempt_reset_at: resetAt.toISOString(),
          })
          .eq('id', contractor.id)
      }

      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Auth succeeded — record login and reset attempt counter
    if (contractor) {
      await rateLimitDb
        .from('contractors')
        .update({
          last_login_at: new Date().toISOString(),
          login_attempt_count: 0,
          login_attempt_reset_at: null,
        })
        .eq('id', contractor.id)
    }

    return NextResponse.json({
      success: true,
      session: data.session,
      user: data.user,
    })
  } catch (error) {
    console.error('Login endpoint error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
