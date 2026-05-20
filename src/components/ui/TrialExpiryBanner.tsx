'use client'

import Link from 'next/link'
import { Clock } from 'lucide-react'

interface TrialExpiryBannerProps {
  // Days until trial ends. Negative = already expired. Computed server-side
  // (dashboard layout) to keep this component pure for React 19's purity rules.
  daysRemaining: number | null
}

export default function TrialExpiryBanner({ daysRemaining }: TrialExpiryBannerProps) {
  // Only show in the final 2 days, and not after expiry (the middleware redirects in that case).
  if (daysRemaining === null || daysRemaining > 2 || daysRemaining < 0) return null

  const label =
    daysRemaining <= 0
      ? 'Your free trial ends today.'
      : daysRemaining === 1
        ? 'Your free trial ends tomorrow.'
        : `Your free trial ends in ${daysRemaining} days.`

  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-amber-50 border-b border-amber-200"
    >
      <div className="max-w-4xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-amber-900">
          <Clock className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{label} Subscribe to keep your jobs and variations.</span>
        </div>
        <Link
          href="/subscribe"
          className="shrink-0 text-xs font-medium bg-amber-900 text-white rounded-full px-3 py-1 hover:bg-amber-800 transition-colors"
        >
          Subscribe
        </Link>
      </div>
    </div>
  )
}
