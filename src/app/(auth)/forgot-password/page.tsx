'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Spinner } from '@/components/ui/Spinner'

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const form = new FormData(e.currentTarget)
    const email = form.get('email') as string

    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })

    setLoading(false)

    if (!res.ok) {
      const { error: apiError } = await res.json()
      setError(apiError || 'Something went wrong. Please try again.')
      return
    }

    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="bg-white rounded-xl shadow-[0_20px_60px_rgba(15,23,32,0.14),0_2px_8px_rgba(15,23,32,0.06)] overflow-hidden">
        <div className="p-8 sm:p-10 text-center">
          <h2 className="text-xl font-semibold text-vt-primary mb-3">Check Your Email</h2>
          <p className="text-sm text-vt-muted mb-6">
            If that address is registered, you&apos;ll receive a password reset link shortly.
          </p>
          <Link href="/login" className="text-sm font-semibold text-vt-primary hover:text-vt-primary-hover hover:underline">
            &larr; Back to Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-[0_20px_60px_rgba(15,23,32,0.14),0_2px_8px_rgba(15,23,32,0.06)] overflow-hidden">
      <div className="p-8 sm:p-10 flex flex-col gap-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-vt-primary">Reset Your Password</h2>
          <p className="text-sm text-vt-muted mt-2 leading-relaxed">Enter your email and we&apos;ll send you a reset link.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-semibold text-vt-dark">
              Email Address
            </label>
            <div className="relative flex items-center">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                spellCheck={false}
                required
                disabled={loading}
                className="w-full h-11 rounded-xl border border-vt-border pl-3.5 pr-10 text-sm text-vt-dark bg-white focus:outline-none focus:border-vt-primary focus:ring-4 focus:ring-vt-primary/15"
                placeholder="joe@example.com"
              />
              <svg aria-hidden="true" className="absolute right-3.5 pointer-events-none" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
            </div>
          </div>

          {error && (
            <p className="text-sm text-vt-error bg-vt-error-bg rounded-xl px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-[46px] flex items-center justify-center gap-2 bg-vt-primary text-white rounded-xl text-sm font-semibold hover:bg-vt-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading && <Spinner />}
            {loading ? 'Sending…' : 'Send Reset Link'}
          </button>
        </form>
      </div>

      <div className="border-t border-[#EEF1F5] px-8 sm:px-10 py-4 text-center">
        <Link href="/login" className="text-sm font-semibold text-vt-primary hover:text-vt-primary-hover hover:underline">
          &larr; Back to Sign In
        </Link>
      </div>
    </div>
  )
}
