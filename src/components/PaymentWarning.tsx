'use client'

interface PaymentWarningProps {
  status?: string | null
  gracePeriodExpiresAt?: string | null
}

export function PaymentWarning({ status, gracePeriodExpiresAt }: PaymentWarningProps) {
  if (!status || !['past_due', 'incomplete'].includes(status)) return null

  if (!gracePeriodExpiresAt) return null

  const expiresAt = new Date(gracePeriodExpiresAt)
  const now = new Date()
  const daysRemaining = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  // Don't show if grace period has already expired
  if (daysRemaining <= 0) return null

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
      <p className="text-sm font-medium text-yellow-900">
        ⚠️ Payment Required
      </p>
      <p className="text-sm text-yellow-800 mt-1">
        Your payment failed. You have {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} to update your payment method
        before access is suspended.
      </p>
      <a
        href="/api/stripe/portal"
        className="text-sm text-yellow-700 underline mt-2 inline-block hover:text-yellow-900"
      >
        Update payment method →
      </a>
    </div>
  )
}
