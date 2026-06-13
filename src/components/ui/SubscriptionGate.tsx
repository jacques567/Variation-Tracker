'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'

interface SubscriptionGateProps {
  isValid: boolean
}

/**
 * Client-side subscription gate. Redirects to /subscribe when the subscription is
 * invalid, except when already on /subscribe (avoids an infinite redirect loop).
 * The real enforcement is at the API and RLS layer; this is the UX redirect.
 */
export default function SubscriptionGate({ isValid }: SubscriptionGateProps) {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!isValid && pathname !== '/subscribe') {
      router.replace('/subscribe')
    }
  }, [isValid, pathname, router])

  return null
}
