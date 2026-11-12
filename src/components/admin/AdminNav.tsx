'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function AdminNav() {
  const pathname = usePathname()
  const isDashboard = pathname === '/admin'

  const activeClass = 'text-sm text-white font-semibold'
  const inactiveClass = 'text-sm text-[#9AA6B5] hover:text-white transition-colors'

  return (
    <nav className="flex items-center gap-6 ml-7">
      <Link href="/admin" className={isDashboard ? activeClass : inactiveClass}>
        Dashboard
      </Link>
      <Link href="/admin/contractors" className={!isDashboard ? activeClass : inactiveClass}>
        Contractors
      </Link>
    </nav>
  )
}
