import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import NavBar from '@/components/ui/NavBar'
import TrialExpiryBanner from '@/components/ui/TrialExpiryBanner'
import PaymentWarning from '@/components/ui/PaymentWarning'
import { evaluateSubscription } from '@/lib/subscription-guard'

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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <NavBar contractor={contractor} hasSubscription={isValid} />
      <PaymentWarning
        subscriptionStatus={contractor?.subscription_status ?? null}
        gracePeriodExpiresAt={contractor?.grace_period_expires_at ?? null}
      />
      <TrialExpiryBanner
        trialEndsAt={contractor?.trial_ends_at ?? null}
        subscriptionStatus={contractor?.subscription_status ?? null}
      />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-6 w-full">
        {children}
      </main>
    </div>
  )
}
