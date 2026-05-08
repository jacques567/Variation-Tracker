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

function adminClient() {
  return createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
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

    const supabase = adminClient()

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

export async function getWebhookLogs(
  hours: number = 24,
  status?: 'success' | 'failed'
) {
  try {
    const supabase = adminClient()
    const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()

    let query = supabase
      .from('stripe_webhook_logs')
      .select('*')
      .gte('logged_at', since)
      .order('logged_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching webhook logs:', error)
    return []
  }
}

export async function pruneWebhookLogs(days: number = 30): Promise<void> {
  try {
    const supabase = adminClient()
    const before = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

    const { error } = await supabase
      .from('stripe_webhook_logs')
      .delete()
      .lt('logged_at', before)

    if (error) {
      console.error('Failed to prune webhook logs:', error)
    }
  } catch (error) {
    console.error('Webhook log pruning error:', error)
  }
}
