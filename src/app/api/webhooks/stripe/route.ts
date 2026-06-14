import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { logWebhookEvent } from '@/lib/webhook-logger'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import Stripe from 'stripe'

function adminClient() {
  return createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function calculateGracePeriodExpiry(): string {
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)
  return expiresAt.toISOString()
}

async function updateSubscription(
  customerId: string,
  status: string,
  subscriptionId: string | null
) {
  const supabase = adminClient()

  const gracePeriodExpiresAt =
    status === 'past_due' ? calculateGracePeriodExpiry() : null

  const updateData: Record<string, unknown> = {
    subscription_status: status,
    subscription_id: subscriptionId,
    grace_period_expires_at: gracePeriodExpiresAt,
  }

  if (status === 'active') {
    updateData.trial_ends_at = null
  }

  const { error } = await supabase
    .from('contractors')
    .update(updateData)
    .eq('stripe_customer_id', customerId)

  if (error) {
    throw new Error(`Failed to update subscription: ${error.message}`)
  }
}

export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) {
    console.error('Webhook secret not configured')
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    )
  }

  const body = await request.text()
  if (Buffer.byteLength(body, 'utf-8') > 1_048_576) {
    console.warn('Stripe webhook rejected: payload exceeds 1MB limit')
    return NextResponse.json({ error: 'Payload too large' }, { status: 413 })
  }

  const sig = request.headers.get('stripe-signature')!

  const stripe = getStripe()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Invalid signature:', errorMessage)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const subscription = event.data.object as Stripe.Subscription

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await updateSubscription(
          subscription.customer as string,
          subscription.status,
          subscription.id
        )
        await logWebhookEvent(event, 'success')
        break

      case 'customer.subscription.deleted':
        await updateSubscription(subscription.customer as string, 'canceled', null)
        await logWebhookEvent(event, 'success')
        break

      default:
        console.log(`Unhandled webhook event: ${event.type}`)
        await logWebhookEvent(event, 'success')
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Webhook processing error:', errorMessage)

    try {
      await logWebhookEvent(event, 'failed', errorMessage)
    } catch (logError) {
      console.error('Failed to log webhook error:', logError)
    }

    // Return 200 to avoid Stripe retrying on recoverable errors;
    // the failure is recorded in stripe_webhook_logs for debugging.
    return NextResponse.json({ received: true, error: errorMessage }, { status: 200 })
  }
}
