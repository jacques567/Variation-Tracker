'use client'

import { useState } from 'react'

export function SubscribeButton() {
  const [loading, setLoading] = useState(false)

  async function handleSubscribe() {
    setLoading(true)
    const res = await fetch('/api/stripe/checkout', { method: 'POST' })
    const { url } = await res.json()
    window.location.href = url
  }

  return (
    <button
      onClick={handleSubscribe}
      disabled={loading}
      className="w-full bg-blue-600 text-white rounded-xl py-3 font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
    >
      {loading ? 'Redirecting...' : 'Subscribe now'}
    </button>
  )
}
