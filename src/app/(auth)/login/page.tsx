'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Spinner } from '@/components/ui/Spinner'
import { OAuthButtons } from '@/components/auth/OAuthButtons'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const form = new FormData(e.currentTarget)
    const email = form.get('email') as string
    const password = form.get('password') as string

    try {
      // Call server-side login endpoint for auth + rate limiting + tracking
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!res.ok) {
        const { error: apiError } = await res.json()
        setError(apiError || 'Login failed')
        setLoading(false)
        return
      }

      // Check if user is admin — check-admin reads the session from cookies
      // (already set by the login request above), no token needs to be passed.
      const adminRes = await fetch('/api/admin/check-admin')

      const isAdmin = adminRes.ok

      // Honour the ?next= param set by middleware, fall back to /jobs or /admin
      const next = searchParams.get('next')
      const redirectTo =
        next && next.startsWith('/') && !next.startsWith('//')
          ? next
          : isAdmin
            ? '/admin'
            : '/jobs'

      router.push(redirectTo)
    } catch (err) {
      console.error('Login error:', err)
      setError('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  const callbackError = searchParams.get('error')

  return (
    <div className="bg-white rounded-xl shadow-[0_20px_60px_rgba(15,23,32,0.14),0_2px_8px_rgba(15,23,32,0.06)] overflow-hidden">
      <div className="p-8 sm:p-10 flex flex-col gap-6">
        <h2 className="text-center text-xl font-semibold text-vt-primary">Log in to Your Account</h2>

        {callbackError === 'auth_callback_failed' && (
          <p className="text-sm text-vt-error bg-vt-error-bg rounded-xl px-3 py-2 -mt-2">
            The confirmation link is invalid or has expired. Please try again.
          </p>
        )}

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
                className="w-full h-11 rounded-xl border border-vt-border pl-3.5 pr-10 text-sm text-vt-dark bg-white focus:outline-none focus:border-vt-primary focus:ring-4 focus:ring-vt-primary/15"
                placeholder="you@company.com"
                disabled={loading}
              />
              <svg aria-hidden="true" className="absolute right-3.5 pointer-events-none" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-semibold text-vt-dark">
              Password
            </label>
            <div className="relative flex items-center">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                className="w-full h-11 rounded-xl border border-vt-border pl-3.5 pr-10 text-sm text-vt-dark bg-white focus:outline-none focus:border-vt-primary focus:ring-4 focus:ring-vt-primary/15"
                placeholder="Enter your password"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                className="absolute right-0 top-0 h-11 w-11 flex items-center justify-center text-[#6B7280] hover:text-vt-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-vt-primary focus-visible:outline-offset-[-2px] rounded-xl"
              >
                {showPassword ? (
                  <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" /><circle cx="12" cy="12" r="3" /></svg>
                ) : (
                  <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" y1="2" x2="22" y2="22" /></svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-vt-error bg-vt-error-bg rounded-xl px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-[46px] flex items-center justify-center gap-2 bg-vt-dark text-white rounded-xl text-sm font-semibold hover:bg-[#1a2532] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading && <Spinner />}
            {loading ? 'Signing in…' : 'Log In'}
          </button>

          <Link href="/forgot-password" className="text-center text-sm font-medium text-vt-primary hover:text-vt-primary-hover hover:underline">
            Forgot password?
          </Link>
        </form>

        <OAuthButtons next={searchParams.get('next')} />
      </div>

      <div className="border-t border-[#EEF1F5] px-8 sm:px-10 py-4 text-center">
        <span className="text-sm text-vt-muted-2">Don&apos;t have an account? </span>
        <Link href="/register" className="text-sm font-semibold text-vt-primary hover:text-vt-primary-hover hover:underline">
          Create one free
        </Link>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
