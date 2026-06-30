import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe'
import { Errors } from '@/lib/errors'

export async function POST(request: NextRequest) {
  try {
    // Use session client only for auth — all contractor writes use service role
    // because migration 014 restricts the authenticated role to profile columns only.
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      const err = Errors.unauthorized()
      return NextResponse.json(err.toJSON(), { status: err.statusCode })
    }

    const stripe = getStripe()

    // Service role client bypasses column-level grants — required for stripe_customer_id.
    const serviceSupabase = await createServiceRoleClient()

    const { data: contractor } = await serviceSupabase
      .from('contractors')
      .select('stripe_customer_id, email, full_name')
      .eq('id', user.id)
      .single()

    let customerId = contractor?.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: contractor?.email ?? user.email,
        name: contractor?.full_name ?? undefined,
        metadata: { supabase_user_id: user.id },
      })
      customerId = customer.id

      // Persist the Stripe customer ID. Must use service role — the authenticated role
      // cannot write stripe_customer_id after migration 014_lockdown_contractor_columns.
      const { error: updateError } = await serviceSupabase
        .from('contractors')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)

      if (updateError) {
        // Stripe customer was created but ID couldn't be saved — log and continue.
        // The checkout session will still work; on next visit we'll create a new customer.
        // A future cleanup job can deduplicate orphaned Stripe customers by email.
        console.error('Failed to persist stripe_customer_id:', updateError.message)
      }
    }

    // No trial_period_days — users receive a 7-day trial at signup (app-managed,
    // no card required). Adding a second Stripe trial would give users 14 free days
    // total and is unintentional. The Stripe subscription starts immediately on payment.
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL
      ? process.env.NEXT_PUBLIC_APP_URL.startsWith('http')
        ? process.env.NEXT_PUBLIC_APP_URL
        : `https://${process.env.NEXT_PUBLIC_APP_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : (request.headers.get('origin') ?? `https://${request.headers.get('host')}`)

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
      success_url: `${baseUrl}/jobs?subscribed=true`,
      cancel_url: `${baseUrl}/subscribe`,
      subscription_data: {
        metadata: { supabase_user_id: user.id },
      },
    })

    return NextResponse.json({ url: session.url })
  } catch {
    const err = Errors.stripeError('Failed to create checkout session')
    return NextResponse.json(err.toJSON(), { status: err.statusCode })
  }
}

