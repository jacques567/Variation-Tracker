'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import { LogOut } from 'lucide-react'
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
    <header className="bg-white border-b border-vt-light">
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/jobs" className="flex items-center gap-2 font-bold text-vt-dark tracking-tight">
          <Image src="/VarTrackerLogo3Trans.png" alt="" width={40} height={40} className="h-10 w-10 sm:h-[44px] sm:w-[44px] object-contain" />
          VarTracker
        </Link>

        <div className="flex items-center gap-6">
          <Link href="/categories" className="text-sm text-vt-muted-2 hover:text-vt-dark transition-colors hidden sm:block">
            Categories
          </Link>
          {isAdmin && (
            <Link href="/admin" className="text-sm text-vt-muted-2 hover:text-vt-dark transition-colors hidden sm:block">
              Admin
            </Link>
          )}
          <div className="flex items-center gap-4">
            {!hasSubscription && (
              <Link href="/subscribe"
                className="text-xs bg-vt-primary text-white rounded-full px-3 py-1 font-medium hover:bg-vt-primary-hover transition-colors">
                Start free trial
              </Link>
            )}
            <span className="text-sm text-vt-muted hidden sm:block">
              {contractor?.full_name}
            </span>
            <button
              onClick={handleSignOut}
              aria-label="Sign out"
              className="flex items-center gap-1.5 text-sm text-vt-muted hover:text-vt-dark transition-colors"
            >
              <LogOut className="w-4 h-4" aria-hidden="true" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
