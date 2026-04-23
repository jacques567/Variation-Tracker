import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import Stripe from 'stripe'

function adminClient() {
  return createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function updateSubscription(
  customerId: string,
  status: string,
  subscriptionId: string | null
) {
  const supabase = adminClient()
  await supabase
    .from('contractors')
    .update({ subscription_status: status, subscription_id: subscriptionId })
    .eq('stripe_customer_id', customerId)
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const subscription = (event.data.object as Stripe.Subscription)

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      await updateSubscription(
        subscription.customer as string,
        subscription.status,
        subscription.id
      )
      break
    case 'customer.subscription.deleted':
      await updateSubscription(subscription.customer as string, 'canceled', null)
      break
  }

  return NextResponse.json({ received: true })
}
