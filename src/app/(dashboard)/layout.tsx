import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import NavBar from '@/components/ui/NavBar'
import TrialExpiryBanner from '@/components/ui/TrialExpiryBanner'
import PaymentWarning from '@/components/ui/PaymentWarning'
import SubscriptionGate from '@/components/ui/SubscriptionGate'
import { evaluateSubscription, isBetaMode } from '@/lib/subscription-guard'

const MS_PER_DAY = 1000 * 60 * 60 * 24

function daysUntil(iso: string | null | undefined): number | null {
  if (!iso) return null
  return Math.ceil((new Date(iso).getTime() - Date.now()) / MS_PER_DAY)
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: contractor } = await supabase
    .from('contractors')
    .select('*')
    .eq('id', user.id)
    .single()

  const { isValid } = evaluateSubscription(contractor)
  const betaMode = isBetaMode()

  const trialDaysRemaining =
    !betaMode && contractor?.subscription_status === 'trialing'
      ? daysUntil(contractor.trial_ends_at)
      : null
  const graceDaysRemaining =
    !betaMode && contractor?.subscription_status === 'past_due'
      ? daysUntil(contractor.grace_period_expires_at)
      : null

  // Server-side guard: redirect expired/invalid users before any content renders.
  // SubscriptionGate below is a client-side belt-and-suspenders; this is the real gate.
  if (!betaMode && !isValid) redirect('/subscribe')

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {!betaMode && <SubscriptionGate isValid={isValid} />}
      <NavBar contractor={contractor} hasSubscription={isValid} />
      <PaymentWarning
        subscriptionStatus={contractor?.subscription_status ?? null}
        daysRemaining={graceDaysRemaining}
      />
      <TrialExpiryBanner daysRemaining={trialDaysRemaining} />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-6 w-full">
        {children}
      </main>
    </div>
  )
}
