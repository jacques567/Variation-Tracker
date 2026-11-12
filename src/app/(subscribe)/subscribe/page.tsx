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

function FeatureList() {
  return (
    <div className="bg-white border border-vt-border rounded-[16px] p-[26px] mb-5 shadow-[0_20px_60px_rgba(15,23,32,0.10),0_2px_8px_rgba(15,23,32,0.05)]">
      <div className="flex items-end gap-[5px] mb-5">
        <span className="text-[38px] font-bold text-vt-dark leading-none">£15</span>
        <span className="text-sm text-vt-muted mb-1">/month</span>
      </div>
      <ul className="flex flex-col gap-3">
        {features.map((f) => (
          <li key={f} className="flex items-center gap-2.5 text-sm text-[#374151]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0EA65C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            {f}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default async function SubscribePage() {
  if (isBetaMode) {
    return (
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-[52px] h-[52px] bg-[#E5EEFA] rounded-full mb-3.5">
          <Zap className="w-6 h-6 text-vt-primary" />
        </div>
        <h1 className="text-[22px] font-bold text-vt-dark">You&apos;re on beta access</h1>
        <p className="text-vt-muted mt-1.5 text-sm">Full access is included while VarTracker is in beta. No subscription needed yet.</p>
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
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-[52px] h-[52px] bg-[#ECFDF5] rounded-full mb-3.5">
          <Check className="w-6 h-6 text-vt-success" />
        </div>
        <h1 className="text-[22px] font-bold text-vt-dark">You&apos;re subscribed</h1>
        <p className="text-vt-muted mt-1.5 text-sm">Manage your subscription anytime.</p>
        <div className="mt-6">
          <ManageSubscriptionButton />
          <p className="text-xs text-vt-muted text-center mt-3">
            Opens Stripe portal · Secure payment
          </p>
        </div>
      </div>
    )
  }

  // Grace period has lapsed — send to billing portal (not fresh checkout, which would 409)
  if (status === 'past_due' && stripeCustomerId) {
    return (
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-[52px] h-[52px] bg-amber-100 rounded-full mb-3.5">
          <AlertTriangle className="w-6 h-6 text-amber-600" />
        </div>
        <h1 className="text-[22px] font-bold text-vt-dark">Payment failed</h1>
        <p className="text-vt-muted mt-1.5 text-sm">
          We couldn&apos;t process your last payment and your grace period has ended.
          Update your card to restore access — no need to resubscribe.
        </p>
        <div className="mt-6">
          <ManageSubscriptionButton />
          <p className="text-xs text-vt-muted text-center mt-3">
            Opens Stripe portal · Secure payment
          </p>
        </div>
      </div>
    )
  }

  if (status === 'canceled') {
    return (
      <>
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-[52px] h-[52px] bg-[#F3F4F6] rounded-full mb-3.5">
            <XCircle className="w-6 h-6 text-vt-muted" />
          </div>
          <h1 className="text-[22px] font-bold text-vt-dark">Subscription cancelled</h1>
          <p className="text-vt-muted mt-1.5 text-sm">
            Your VarTracker subscription has ended. Resubscribe anytime — your jobs and variations are still here waiting for you.
          </p>
        </div>
        <FeatureList />
        <SubscribeButton />
        <p className="text-xs text-vt-muted text-center mt-3">
          Secure payment via Stripe · Cancel any time
        </p>
      </>
    )
  }

  if (status === 'trialing') {
    return (
      <>
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-[52px] h-[52px] bg-[#E5EEFA] rounded-full mb-3.5">
            <Clock className="w-6 h-6 text-vt-primary" />
          </div>
          <h1 className="text-[22px] font-bold text-vt-dark">Your trial has ended</h1>
          <p className="text-vt-muted mt-1.5 text-sm">Subscribe to keep using VarTracker. £15/month, cancel any time.</p>
        </div>
        <FeatureList />
        <SubscribeButton />
        <p className="text-xs text-vt-muted text-center mt-3">
          Secure payment via Stripe · Cancel any time
        </p>
      </>
    )
  }

  return (
    <>
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-[52px] h-[52px] bg-[#E5EEFA] rounded-full mb-3.5">
          <Zap className="w-6 h-6 text-vt-primary" />
        </div>
        <h1 className="text-[22px] font-bold text-vt-dark">Subscribe to VarTracker</h1>
        <p className="text-vt-muted mt-1.5 text-sm">£15/month. Cancel any time.</p>
      </div>
      <FeatureList />
      <SubscribeButton />
      <p className="text-xs text-vt-muted text-center mt-3">
        Secure payment via Stripe · Cancel any time
      </p>
    </>
  )
}
