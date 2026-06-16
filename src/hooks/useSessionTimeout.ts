'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000 // 15 minutes
const WARNING_THRESHOLD_MS = 2 * 60 * 1000 // Show warning 2 minutes before logout

export function useSessionTimeout() {
  const router = useRouter()
  const [showWarning, setShowWarning] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(0)

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const warningIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastActivityRef = useRef<number>(Date.now())

  const resetInactivityTimer = () => {
    lastActivityRef.current = Date.now()
    setShowWarning(false)

    // Clear existing timers
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current)
    if (warningIntervalRef.current) clearInterval(warningIntervalRef.current)

    // Set warning timer
    warningTimeoutRef.current = setTimeout(() => {
      setShowWarning(true)
      setTimeRemaining(WARNING_THRESHOLD_MS / 1000)

      // Update countdown every second
      warningIntervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            if (warningIntervalRef.current) {
              clearInterval(warningIntervalRef.current)
            }
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }, INACTIVITY_TIMEOUT_MS - WARNING_THRESHOLD_MS)

    // Set logout timer
    timeoutRef.current = setTimeout(async () => {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/login')
      router.refresh()
    }, INACTIVITY_TIMEOUT_MS)
  }

  const handleStayActive = () => {
    setShowWarning(false)
    resetInactivityTimer()
  }

  const handleLogout = async () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current)
    if (warningIntervalRef.current) clearInterval(warningIntervalRef.current)

    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  useEffect(() => {
    // Activity events to monitor
    const activityEvents = [
      'mousedown',
      'keydown',
      'scroll',
      'touchstart',
      'click',
    ]

    const handleActivity = () => {
      resetInactivityTimer()
    }

    // Set initial timer
    resetInactivityTimer()

    // Add event listeners
    activityEvents.forEach((event) => {
      document.addEventListener(event, handleActivity)
    })

    return () => {
      // Cleanup
      activityEvents.forEach((event) => {
        document.removeEventListener(event, handleActivity)
      })

      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current)
      if (warningIntervalRef.current) clearInterval(warningIntervalRef.current)
    }
  }, [])

  return {
    showWarning,
    timeRemaining,
    handleStayActive,
    handleLogout,
  }
}
