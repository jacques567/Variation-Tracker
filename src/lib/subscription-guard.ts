/**
 * Server-side subscription enforcement — uses service role, Node.js only.
 * Do NOT import this in 'use client' components. Use subscription-evaluation.ts instead.
 *
 * The evaluation logic (evaluateSubscription) lives in subscription-evaluation.ts and is
 * re-exported here for server-side callers. The DB-layer equivalent is has_active_subscription()
 * in supabase/migrations/016_rls_subscription_enforcement.sql — any rule change must update both.
 */
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import { Errors } from './errors'
import {
  evaluateSubscription,
  type ContractorSubscriptionRow,
  type SubscriptionStatus,
} from './subscription-evaluation'

// Re-export so existing server-side callers don't need to change their import path.
export { evaluateSubscription }
export type { ContractorSubscriptionRow, SubscriptionStatus }

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

export function subscriptionError(reason: string) {
  return Errors.forbidden(reason)
}
