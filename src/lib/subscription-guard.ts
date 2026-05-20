import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import { Errors } from './errors'

const ACTIVE_STATUSES = ['active']

interface SubscriptionStatus {
  isValid: boolean
  status: string | null
  reason?: string
}

export interface ContractorSubscriptionRow {
  subscription_status: string | null
  trial_ends_at: string | null
  grace_period_expires_at: string | null
}

export function evaluateSubscription(
  contractor: ContractorSubscriptionRow | null
): SubscriptionStatus {
  if (!contractor) {
    return { isValid: false, status: null, reason: 'Contractor not found' }
  }

  const status = contractor.subscription_status || 'none'

  if (ACTIVE_STATUSES.includes(status)) {
    return { isValid: true, status }
  }

  if (status === 'trialing') {
    if (!contractor.trial_ends_at) {
      // No trial expiry recorded — treat as invalid. Both signup auto-enrollment and
      // future Stripe-managed trials must populate trial_ends_at via the webhook;
      // a null here indicates a partial write or manual SQL tampering.
      return { isValid: false, status, reason: 'Trial expiry not set. Please contact support.' }
    }
    if (new Date(contractor.trial_ends_at) > new Date()) {
      return { isValid: true, status }
    }
    return { isValid: false, status, reason: 'Your free trial has ended. Please subscribe to continue.' }
  }

  if (status === 'past_due' && contractor.grace_period_expires_at) {
    if (new Date(contractor.grace_period_expires_at) > new Date()) {
      return { isValid: true, status: 'past_due_grace_period' }
    }
  }

  return { isValid: false, status, reason: getReasonForStatus(status) }
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
      .select('subscription_status, trial_ends_at, grace_period_expires_at')
      .eq('id', contractorId)
      .single()

    if (error || !contractor) {
      return { isValid: false, status: null, reason: 'Contractor not found' }
    }

    return evaluateSubscription(contractor)
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
