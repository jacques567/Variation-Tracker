'use client'

import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'

interface PaymentWarningProps {
  subscriptionStatus: string | null
  // Days until grace period ends. null = no grace period set. Negative = expired.
  // Computed server-side (dashboard layout) to keep this component pure.
  daysRemaining: number | null
}

export default function PaymentWarning({
  subscriptionStatus,
  daysRemaining,
}: PaymentWarningProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (subscriptionStatus !== 'past_due') return null

  const message =
    daysRemaining === null
      ? "Your payment is overdue."
      : daysRemaining <= 0
        ? 'Your payment is overdue and access will be revoked shortly.'
        : daysRemaining === 1
          ? 'Your payment is overdue. You have 1 day to update your payment method.'
          : `Your payment is overdue. You have ${daysRemaining} days to update your payment method.`

  async function openBillingPortal() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      if (!res.ok) {
        setError('Could not open billing portal. Please try again.')
        setLoading(false)
        return
      }
      const { url } = await res.json()
      if (url) window.location.href = url
    } catch {
      setError('Could not open billing portal. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="bg-red-50 border-b border-red-200"
    >
      <div className="max-w-4xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-red-900">
          <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{message}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {error && <span className="text-xs text-red-700">{error}</span>}
          <button
            onClick={openBillingPortal}
            disabled={loading}
            className="text-xs font-medium bg-red-700 text-white rounded-full px-3 py-1 hover:bg-red-800 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Opening...' : 'Update payment'}
          </button>
        </div>
      </div>
    </div>
  )
}
