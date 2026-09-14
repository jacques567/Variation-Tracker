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
      className="text-sm text-[#9AA6B5] border border-[#2C3A4C] rounded-lg px-3.5 py-2 hover:text-white hover:border-[#3D5166] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {loading ? 'Signing out...' : 'Exit Admin'}
    </button>
  )
}
