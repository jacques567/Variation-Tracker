'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ExitAdminButton() {
  const router = useRouter()

  async function handleExit() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleExit}
      className="text-sm text-gray-500 hover:text-gray-900"
    >
      Exit Admin
    </button>
  )
}
