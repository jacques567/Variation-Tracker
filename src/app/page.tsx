import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LaunchVideo from '@/components/ui/LaunchVideo'

function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-6" style={{ backgroundColor: '#0d1b2a' }}>
      <div className="flex flex-col items-center text-center max-w-3xl w-full gap-6">
        <LaunchVideo />

        <div className="space-y-3">
          <h1 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight">
            Coming Soon
          </h1>
          <p className="text-lg text-blue-300 font-medium">
            Track variations. Get client sign-offs.
          </p>
          <p className="text-sm text-gray-400 leading-relaxed max-w-sm mx-auto">
            VarTracker helps contractors log change orders, notify clients, and collect
            electronic sign-offs — all in one place. Built for electricians, plumbers,
            builders, and anyone managing construction jobs.
          </p>
        </div>
      </div>
    </main>
  )
}

export default async function RootPage() {
  const isBeta = process.env.NEXT_PUBLIC_BETA_MODE === 'true'

  if (isBeta) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      redirect('/jobs')
    } else {
      redirect('/login')
    }
  }

  return <LandingPage />
}
