import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if user email is in admin_emails table
  const { data: adminEmail } = await supabase
    .from('admin_emails')
    .select('email')
    .eq('email', user.email)
    .single()

  if (!adminEmail) {
    redirect('/jobs')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/admin" className="font-semibold text-gray-900">
            Admin
          </Link>
          <nav className="flex gap-6">
            <Link href="/admin" className="text-sm text-gray-600 hover:text-gray-900">
              Dashboard
            </Link>
            <Link href="/admin/contractors" className="text-sm text-gray-600 hover:text-gray-900">
              Contractors
            </Link>
          </nav>
          <Link href="/jobs" className="text-sm text-gray-500 hover:text-gray-900">
            Exit Admin
          </Link>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
