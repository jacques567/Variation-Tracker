'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Briefcase, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import type { Contractor } from '@/types'

export default function NavBar({ contractor, hasSubscription }: { contractor: Contractor | null; hasSubscription?: boolean }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const checkAdmin = async () => {
      if (!contractor?.email) return
      const supabase = createClient()
      const { data } = await supabase
        .from('admin_emails')
        .select('email')
        .eq('email', contractor.email)
        .single()
      setIsAdmin(!!data)
    }
    checkAdmin()
  }, [contractor?.email])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/jobs" className="flex items-center gap-2 font-semibold text-gray-900">
          <Briefcase className="w-5 h-5 text-blue-600" />
          VarTracker
        </Link>

        <div className="flex items-center gap-6">
          <Link href="/categories" className="text-sm text-gray-600 hover:text-gray-900 transition-colors hidden sm:block">
            Categories
          </Link>
          {isAdmin && (
            <Link href="/admin" className="text-sm text-gray-600 hover:text-gray-900 transition-colors hidden sm:block">
              Admin
            </Link>
          )}
          <div className="flex items-center gap-4">
            {!hasSubscription && (
              <Link href="/subscribe"
                className="text-xs bg-blue-600 text-white rounded-full px-3 py-1 font-medium hover:bg-blue-700 transition-colors">
                Start free trial
              </Link>
            )}
            <span className="text-sm text-gray-500 hidden sm:block">
              {contractor?.full_name}
            </span>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
