import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import Stripe from 'stripe'

interface WebhookLog {
  event_type: string
  event_id: string
  status: 'success' | 'failed'
  error_message: string | null
  customer_id: string | null
  subscription_id: string | null
  payload: Record<string, unknown>
  logged_at: string
}

export async function logWebhookEvent(
  event: Stripe.Event,
  status: 'success' | 'failed',
  errorMessage: string | null = null
): Promise<void> {
  try {
    const subscription = event.data.object as Stripe.Subscription | undefined
    const customerId = subscription?.customer as string | undefined
    const subscriptionId = subscription?.id

    const supabase = createSupabaseAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const log: WebhookLog = {
      event_type: event.type,
      event_id: event.id,
      status,
      error_message: errorMessage,
      customer_id: customerId || null,
      subscription_id: subscriptionId || null,
      payload: event.data.object as unknown as Record<string, unknown>,
      logged_at: new Date().toISOString(),
    }

    const { error } = await supabase.from('stripe_webhook_logs').insert([log])

    if (error) {
      console.error('Failed to log webhook event:', error)
    }
  } catch (error) {
    console.error('Webhook logging error:', error)
  }
}
