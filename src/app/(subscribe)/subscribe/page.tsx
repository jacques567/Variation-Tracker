import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Check, Zap, AlertTriangle, XCircle, Clock } from 'lucide-react'
import { SubscribeButton, ManageSubscriptionButton } from './subscribe-button'
import { evaluateSubscription } from '@/lib/subscription-guard'

const features = [
  'Unlimited jobs and variations',
  'Client e-signature via shareable link',
  'Photo proof on every variation',
  'PDF variation notices',
  'Final invoice export with all variations',
  'Running total updated automatically',
]

const isBetaMode = process.env.NEXT_PUBLIC_BETA_MODE === 'true'

export default async function SubscribePage() {
  if (isBetaMode) {
    return (
      <div className="max-w-sm mx-auto pt-8 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-4">
          <Zap className="w-6 h-6 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">You&apos;re on beta access</h1>
        <p className="text-gray-500 mt-2 text-sm">Full access is included while VarTracker is in beta. No subscription needed yet.</p>
      </div>
    )
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: contractor } = await supabase
    .from('contractors')
    .select('subscription_status, stripe_customer_id, trial_ends_at, grace_period_expires_at')
    .eq('id', user.id)
    .single()

  const status = contractor?.subscription_status ?? null
  const isSubscribed = status === 'active'
  const stripeCustomerId = contractor?.stripe_customer_id

  // /subscribe is directly navigable, not just a redirect target — a contractor who is
  // still mid-trial or mid-grace-period could land here on their own. Use the same
  // canonical check the dashboard layout uses to decide whether to redirect *to* this
  // page, so we never tell someone their trial/grace period ended when it hasn't.
  const { isValid } = evaluateSubscription(contractor ?? null)
  if (isValid && (status === 'trialing' || status === 'past_due')) {
    redirect('/jobs')
  }

  if (isSubscribed && stripeCustomerId) {
    return (
      <div className="max-w-sm mx-auto pt-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-4">
            <Check className="w-6 h-6 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">You&apos;re subscribed</h1>
          <p className="text-gray-500 mt-2 text-sm">Manage your subscription anytime.</p>
        </div>

        <ManageSubscriptionButton />

        <p className="text-xs text-gray-400 text-center mt-4">
          Opens Stripe portal · Secure payment
        </p>
      </div>
    )
  }

  // Reached only once the grace-period redirect above has ruled out "still valid" —
  // so the grace period has actually lapsed. The Stripe subscription still exists
  // (mid-retry), so send them to the billing portal rather than a fresh checkout.
  // Fresh checkout would 409 (see /api/stripe/checkout's duplicate-subscription guard,
  // which treats 'past_due' as an existing active subscription).
  if (status === 'past_due' && stripeCustomerId) {
    return (
      <div className="max-w-sm mx-auto pt-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-amber-100 rounded-full mb-4">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Payment failed</h1>
          <p className="text-gray-500 mt-2 text-sm">
            We couldn&apos;t process your last payment and your grace period has ended.
            Update your card to restore access — no need to resubscribe.
          </p>
        </div>

        <ManageSubscriptionButton />

        <p className="text-xs text-gray-400 text-center mt-4">
          Opens Stripe portal · Secure payment
        </p>
      </div>
    )
  }

  // Subscription was cancelled (either by the contractor or after Stripe gave up
  // retrying a failed payment). No Stripe subscription exists anymore, so this is
  // a fresh checkout.
  if (status === 'canceled') {
    return (
      <div className="max-w-sm mx-auto pt-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-4">
            <XCircle className="w-6 h-6 text-gray-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Subscription cancelled</h1>
          <p className="text-gray-500 mt-2 text-sm">
            Your VarTracker subscription has ended. Resubscribe anytime — your jobs and variations are still here waiting for you.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <div className="flex items-end gap-1 mb-6">
            <span className="text-4xl font-bold text-gray-900">£15</span>
            <span className="text-gray-400 mb-1">/month</span>
          </div>

          <ul className="space-y-3">
            {features.map((f) => (
              <li key={f} className="flex items-center gap-2.5 text-sm text-gray-700">
                <Check className="w-4 h-4 text-green-500 shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        <SubscribeButton />

        <p className="text-xs text-gray-400 text-center mt-4">
          Secure payment via Stripe · Cancel any time
        </p>
      </div>
    )
  }

  // Reached only once the redirect above has ruled out "still valid" — the app-managed
  // trial has actually run out.
  if (status === 'trialing') {
    return (
      <div className="max-w-sm mx-auto pt-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4">
            <Clock className="w-6 h-6 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Your trial has ended</h1>
          <p className="text-gray-500 mt-2 text-sm">Subscribe to keep using VarTracker. £15/month, cancel any time.</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <div className="flex items-end gap-1 mb-6">
            <span className="text-4xl font-bold text-gray-900">£15</span>
            <span className="text-gray-400 mb-1">/month</span>
          </div>

          <ul className="space-y-3">
            {features.map((f) => (
              <li key={f} className="flex items-center gap-2.5 text-sm text-gray-700">
                <Check className="w-4 h-4 text-green-500 shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        <SubscribeButton />

        <p className="text-xs text-gray-400 text-center mt-4">
          Secure payment via Stripe · Cancel any time
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-sm mx-auto pt-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4">
          <Zap className="w-6 h-6 text-blue-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Subscribe to VarTracker</h1>
        <p className="text-gray-500 mt-2 text-sm">£15/month. Cancel any time.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <div className="flex items-end gap-1 mb-6">
          <span className="text-4xl font-bold text-gray-900">£15</span>
          <span className="text-gray-400 mb-1">/month</span>
        </div>

        <ul className="space-y-3">
          {features.map((f) => (
            <li key={f} className="flex items-center gap-2.5 text-sm text-gray-700">
              <Check className="w-4 h-4 text-green-500 shrink-0" />
              {f}
            </li>
          ))}
        </ul>
      </div>

      <SubscribeButton />

      <p className="text-xs text-gray-400 text-center mt-4">
        Secure payment via Stripe · Cancel any time
      </p>
    </div>
  )
}
