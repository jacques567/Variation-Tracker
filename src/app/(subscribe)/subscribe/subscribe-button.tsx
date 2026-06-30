'use client'

import { useState } from 'react'

export function SubscribeButton() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubscribe() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' })
      const data = await res.json()
      if (!res.ok || !data.url) {
        setError('Could not start checkout. Please try again.')
        setLoading(false)
        return
      }
      window.location.href = data.url
    } catch {
      setError('Could not start checkout. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleSubscribe}
        disabled={loading}
        className="w-full bg-blue-600 text-white rounded-xl py-3 font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {loading ? 'Redirecting...' : 'Subscribe now'}
      </button>
      {error && <p className="text-xs text-red-600 text-center">{error}</p>}
    </div>
  )
}

export function ManageSubscriptionButton() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleManage() {
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
    <div className="space-y-2">
      <button
        onClick={handleManage}
        disabled={loading}
        className="w-full bg-blue-600 text-white rounded-xl py-3 font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {loading ? 'Opening...' : 'Manage Subscription'}
      </button>
      {error && <p className="text-xs text-red-600 text-center">{error}</p>}
    </div>
  )
}
