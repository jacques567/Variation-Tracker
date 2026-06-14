'use client'

import { useState } from 'react'
import { Check, Zap } from 'lucide-react'

const features = [
  'Unlimited jobs and variations',
  'Client e-signature via shareable link',
  'Photo proof on every variation',
  'PDF variation notices',
  'Final invoice export with all variations',
  'Running total updated automatically',
]

const isBetaMode = process.env.NEXT_PUBLIC_BETA_MODE === 'true'

export default function SubscribePage() {
  const [loading, setLoading] = useState(false)

  if (isBetaMode) {
    return (
      <div className="max-w-sm mx-auto pt-8 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-4">
          <Zap className="w-6 h-6 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">You&apos;re on beta access</h1>
        <p className="text-gray-500 mt-2 text-sm">Full access is included while VarTracker is in beta. No subscription needed yet.</p>
      </div>
    )
  }

  async function handleSubscribe() {
    setLoading(true)
    const res = await fetch('/api/stripe/checkout', { method: 'POST' })
    const { url } = await res.json()
    window.location.href = url
  }

  return (
    <div className="max-w-sm mx-auto pt-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4">
          <Zap className="w-6 h-6 text-blue-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Subscribe to VarTracker</h1>
        <p className="text-gray-500 mt-2 text-sm">£15/month. Cancel any time.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <div className="flex items-end gap-1 mb-6">
          <span className="text-4xl font-bold text-gray-900">£15</span>
          <span className="text-gray-400 mb-1">/month</span>
        </div>

        <ul className="space-y-3">
          {features.map((f) => (
            <li key={f} className="flex items-center gap-2.5 text-sm text-gray-700">
              <Check className="w-4 h-4 text-green-500 shrink-0" />
              {f}
            </li>
          ))}
        </ul>
      </div>

      <button
        onClick={handleSubscribe}
        disabled={loading}
        className="w-full bg-blue-600 text-white rounded-xl py-3 font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {loading ? 'Redirecting...' : 'Subscribe now'}
      </button>

      <p className="text-xs text-gray-400 text-center mt-4">
        Secure payment via Stripe · Cancel any time
      </p>
    </div>
  )
}
