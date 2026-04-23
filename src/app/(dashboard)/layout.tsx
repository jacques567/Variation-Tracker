import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import NavBar from '@/components/ui/NavBar'

const ACTIVE_STATUSES = ['active', 'trialing']

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

  const hasSubscription = ACTIVE_STATUSES.includes(contractor?.subscription_status ?? '')
  const isSubscribePage = false // layout doesn't know the path, gate is below

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar contractor={contractor} hasSubscription={hasSubscription} />
      <main className="max-w-4xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}
