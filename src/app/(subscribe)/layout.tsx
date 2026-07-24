import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function SubscribeLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">VarTracker</h1>
            <p className="text-sm text-gray-500 mt-1">Variation &amp; Change Order Tracker</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
