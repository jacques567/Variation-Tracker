import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe'
import { Errors } from '@/lib/errors'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      const err = Errors.unauthorized()
      return NextResponse.json(err.toJSON(), { status: err.statusCode })
    }

    const stripe = getStripe()

    const { data: contractor } = await supabase
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

      await supabase
        .from('contractors')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
    }

    const session = await stripe.checkout.sessions.create(
      {
        customer: customerId,
        payment_method_types: ['card'],
        mode: 'subscription',
        line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/jobs?subscribed=true`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscribe`,
        subscription_data: {
          trial_period_days: 7,
          metadata: { supabase_user_id: user.id },
        },
      },
      {
        idempotencyKey: `checkout_${user.id}_${process.env.STRIPE_PRICE_ID}`,
      }
    )

    return NextResponse.json({ url: session.url })
  } catch {
    const err = Errors.stripeError('Failed to create checkout session')
    return NextResponse.json(err.toJSON(), { status: err.statusCode })
  }
}
