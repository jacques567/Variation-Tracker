'use client'

import { useEffect, useRef, useState } from 'react'
import { formatCurrency } from '@/lib/utils'

/**
 * Money figure that counts from its previous value to a new one when `value`
 * changes (e.g. the job total after a client signs). The first render shows
 * `value` as-is, so page loads never animate. `value` is in pence.
 */
export default function AnimatedAmount({
  value,
  plusSign = false,
  duration = 900,
}: {
  value: number
  plusSign?: boolean
  duration?: number
}) {
  const [shown, setShown] = useState(value)
  // Mirrors `shown` so an interrupted animation restarts from what's on screen.
  const shownRef = useRef(value)

  useEffect(() => {
    const from = shownRef.current
    if (from === value) return

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const length = reduce ? 0 : duration
    const start = performance.now()
    let frame = 0

    const tick = (now: number) => {
      const t = length === 0 ? 1 : Math.min((now - start) / length, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      const next = t === 1 ? value : Math.round(from + (value - from) * eased)
      shownRef.current = next
      setShown(next)
      if (t < 1) frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value, duration])

  return <>{plusSign && shown >= 0 ? '+' : ''}{formatCurrency(shown)}</>
}
