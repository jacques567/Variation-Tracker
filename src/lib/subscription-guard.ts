import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import { Errors } from './errors'

const ACTIVE_STATUSES = ['active', 'trialing']

interface SubscriptionStatus {
  isValid: boolean
  status: string | null
  reason?: string
}

export async function checkSubscription(
  contractorId: string
): Promise<SubscriptionStatus> {
  try {
    const supabase = createSupabaseAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: contractor, error } = await supabase
      .from('contractors')
      .select('subscription_status, grace_period_expires_at')
      .eq('id', contractorId)
      .single()

    if (error || !contractor) {
      return { isValid: false, status: null, reason: 'Contractor not found' }
    }

    const status = contractor.subscription_status || 'none'

    if (ACTIVE_STATUSES.includes(status)) {
      return { isValid: true, status }
    }

    if (status === 'past_due' && contractor.grace_period_expires_at) {
      const expiresAt = new Date(contractor.grace_period_expires_at)
      if (expiresAt > new Date()) {
        return { isValid: true, status: 'past_due_grace_period' }
      }
    }

    return { isValid: false, status, reason: getReasonForStatus(status) }
  } catch (error) {
    console.error('Subscription check error:', error)
    return { isValid: false, status: null, reason: 'Failed to verify subscription' }
  }
}

function getReasonForStatus(status: string): string {
  switch (status) {
    case 'canceled':
      return 'Your subscription has been cancelled. Please subscribe to continue.'
    case 'past_due':
      return 'Your payment is overdue. Please update your payment method.'
    case 'incomplete':
      return 'Your subscription setup is incomplete. Please complete payment.'
    case 'none':
      return 'No subscription found. Please subscribe to access this feature.'
    default:
      return `Invalid subscription status: ${status}`
  }
}

export function subscriptionError(reason: string) {
  return Errors.forbidden(reason)
}
