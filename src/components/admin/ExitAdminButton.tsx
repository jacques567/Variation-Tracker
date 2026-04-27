'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ExitAdminButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleExit() {
    if (loading) return
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <button
      onClick={handleExit}
      disabled={loading}
      className="text-sm text-gray-500 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? 'Signing out...' : 'Exit Admin'}
    </button>
  )
}
