import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/rate-limit'
import { extractClientIp } from '@/lib/csrf'

const SignupSchema = z.object({
  email: z.string().email('Invalid email format').toLowerCase(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  full_name: z.string().trim().min(1, 'Full name required').max(255, 'Full name too long'),
})

export async function POST(request: NextRequest) {
  try {
    const ip = extractClientIp(request.headers.get('x-forwarded-for'), request.headers.get('x-real-ip')) ?? 'unknown'
    if (!(await checkRateLimit(`signup:${ip}`, 5, 3600_000))) {
      return NextResponse.json(
        { error: 'Too many signup attempts. Try again later.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { email, password, full_name } = SignupSchema.parse(body)

    const supabase = await createClient()

    // Sign up with Supabase auth
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name },
      },
    })

    if (signUpError) {
      const errCode = (signUpError as any).code as string | undefined
      const errStatus = (signUpError as any).status as number | undefined
      console.error('SignUp error:', {
        message: signUpError.message,
        status: errStatus,
        code: errCode,
      })

      // Duplicate email — return 409 so the frontend can distinguish it
      if (
        errCode === 'user_already_exists' ||
        signUpError.message?.toLowerCase().includes('already registered')
      ) {
        return NextResponse.json(
          { error: 'An account with this email already exists.', errorCode: 'user_already_exists' },
          { status: 409 }
        )
      }

      return NextResponse.json(
        { error: signUpError.message || 'Sign up failed', errorCode: errCode },
        { status: 400 }
      )
    }

    if (!data.user) {
      console.error('No user returned from signUp')
      return NextResponse.json(
        { error: 'User creation failed' },
        { status: 500 }
      )
    }

    console.log('User created successfully:', { userId: data.user.id })

    // Auto-enroll a 7-day trial. Stripe webhooks override this if the user pays.
    // Use service-role client + upsert: subscription/trial columns are read-only to the
    // authenticated role (migration 014), and the handle_new_user trigger may have
    // already inserted a row with default values that we need to update.
    const trialEndsAt = new Date()
    trialEndsAt.setDate(trialEndsAt.getDate() + 7)

    const supabaseService = await createServiceRoleClient()
    const { error: createError } = await supabaseService
      .from('contractors')
      .upsert(
        {
          id: data.user.id,
          email,
          full_name,
          subscription_status: 'trialing',
          trial_ends_at: trialEndsAt.toISOString(),
        },
        { onConflict: 'id' }
      )

    if (createError) {
      console.error('Error creating contractor record:', {
        code: createError.code,
        message: createError.message,
        details: (createError as any).details,
      })
      // Auth user was created but contractor record setup failed — clean up the orphan
      // so the user can retry signup rather than being permanently blocked on login.
      await supabaseService.auth.admin.deleteUser(data.user.id)
      return NextResponse.json(
        {
          error: 'Account setup failed. Please try again.',
          errorCode: 'setup_failed',
        },
        { status: 500 }
      )
    }

    console.log('Contractor record created:', { userId: data.user.id })

    return NextResponse.json({
      success: true,
      session: data.session,
      user: data.user,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors = error.issues.map((e: z.ZodIssue) => `${e.path.join('.')}: ${e.message}`)
      return NextResponse.json(
        { error: fieldErrors[0] || 'Validation failed' },
        { status: 400 }
      )
    }
    console.error('Signup endpoint error (check logs for details)')
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
