import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { email, password, full_name } = await request.json()

    if (!email || !password || !full_name) {
      return NextResponse.json(
        { error: 'Email, password, and full name required' },
        { status: 400 }
      )
    }

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
      console.error('SignUp error:', {
        message: signUpError.message,
        status: (signUpError as any).status,
        code: (signUpError as any).code,
      })
      return NextResponse.json(
        { error: signUpError.message || 'Sign up failed' },
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

    console.log('User created successfully:', { userId: data.user.id, email })

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
      return NextResponse.json(
        { error: 'Failed to create contractor record' },
        { status: 500 }
      )
    }

    console.log('Contractor record created:', { userId: data.user.id, email })

    return NextResponse.json({
      success: true,
      session: data.session,
      user: data.user,
    })
  } catch (error) {
    console.error('Signup endpoint error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
