import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Footer from '@/components/ui/Footer'

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Middleware handles this first, but guard here as defence-in-depth
  if (user) redirect('/jobs')

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">VarTracker</h1>
            <p className="text-sm text-gray-500 mt-1">Variation & Change Order Tracker</p>
          </div>
          {children}
        </div>
      </div>
      <Footer />
    </div>
  )
}
