/**
 * Pure subscription evaluation — no Supabase client, no Node.js-only imports.
 * Safe to import in 'use client' components.
 *
 * The evaluation logic here must stay in sync with the Postgres function
 * has_active_subscription() in supabase/migrations/016_rls_subscription_enforcement.sql.
 * Any change to trial/grace-period rules must be reflected in both places.
 */

// BETA_MODE — set via env var, true only on the separate beta deployment
// (beta-vartracker.vercel.app). The production domain (vartracker.com) never
// sets this and serves a coming-soon landing page instead of the app.
//
// On the beta deployment, this intentionally DOES bypass the paywall — beta
// testers get free reign with no subscription required (see the dashboard
// layout's `!betaMode && !isValid` check). evaluateSubscription() /
// has_active_subscription() remain the single source of truth for what
// "valid" means when the paywall IS enforced (i.e. always, in production);
// this flag only controls whether that gate applies at all.
// Server-side: BETA_MODE. Client-side: NEXT_PUBLIC_BETA_MODE.
export function isBetaMode(): boolean {
  return (
    process.env.BETA_MODE === 'true' ||
    process.env.NEXT_PUBLIC_BETA_MODE === 'true'
  )
}

export interface ContractorSubscriptionRow {
  subscription_status: string | null
  trial_ends_at: string | null
  grace_period_expires_at: string | null
}

export interface SubscriptionStatus {
  isValid: boolean
  status: string | null
  reason?: string
}

export function evaluateSubscription(
  contractor: ContractorSubscriptionRow | null
): SubscriptionStatus {
  if (!contractor) {
    return { isValid: false, status: null, reason: 'Contractor not found' }
  }

  const status = contractor.subscription_status || 'none'

  if (status === 'active') {
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
