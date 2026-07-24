import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isBetaMode } from '@/lib/subscription-evaluation'

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  // Production (non-beta) deployments are coming-soon-only — the auth pages
  // only exist for the beta site. Anyone hitting /login, /register, or
  // /forgot-password directly on the live domain lands back on the landing page.
  if (!isBetaMode()) redirect('/')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Middleware handles this first, but guard here as defence-in-depth
  if (user) redirect('/jobs')

  return (
    <div className="min-h-dvh bg-gray-50">
      <div className="flex justify-center px-4 pt-16 pb-4 sm:pt-24">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">VarTracker</h1>
            <p className="text-sm text-gray-500 mt-1">Variation & Change Order Tracker</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
