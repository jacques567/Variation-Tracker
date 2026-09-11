import { redirect } from 'next/navigation'
import { Poppins } from 'next/font/google'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import NavBar from '@/components/ui/NavBar'
import TrialExpiryBanner from '@/components/ui/TrialExpiryBanner'
import PaymentWarning from '@/components/ui/PaymentWarning'
import SubscriptionGate from '@/components/ui/SubscriptionGate'
import SessionTimeoutManager from '@/components/ui/SessionTimeoutManager'
import { evaluateSubscription, isBetaMode } from '@/lib/subscription-guard'

const poppins = Poppins({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-poppins',
})

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

  const betaMode = isBetaMode()
  const { isValid } = evaluateSubscription(contractor)

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
    <div className={`${poppins.variable} font-[family-name:var(--font-poppins)] relative min-h-screen bg-vt-light flex flex-col overflow-hidden`}>
      <Image
        src="/images/bg-app.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover opacity-50"
      />
      <div className="relative flex flex-col flex-1">
        <SessionTimeoutManager />
        {!betaMode && <SubscriptionGate isValid={isValid} />}
        <NavBar contractor={contractor} hasSubscription={betaMode || isValid} />
        <PaymentWarning
          subscriptionStatus={contractor?.subscription_status ?? null}
          daysRemaining={graceDaysRemaining}
        />
        <TrialExpiryBanner daysRemaining={trialDaysRemaining} />
        <main className="flex-1 max-w-4xl mx-auto px-4 py-6 w-full">
          {children}
        </main>
      </div>
    </div>
  )
}
