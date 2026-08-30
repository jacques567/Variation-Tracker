'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Spinner } from '@/components/ui/Spinner'
import { OAuthButtons } from '@/components/auth/OAuthButtons'

function parseSignupError(apiError: string | undefined, status: number): string {
  if (!apiError) return 'Sign up failed. Please try again.'

  if (status === 500) {
    if (apiError.includes('contractor record')) {
      return 'Your account was created but profile setup failed. Please contact support.'
    }
    return 'Something went wrong on our end. Please try again.'
  }

  if (status === 409) {
    return 'An account with this email already exists. Try signing in instead.'
  }

  if (status === 429) {
    return 'Too many sign up attempts. Please wait a moment before trying again.'
  }

  const cleaned = apiError.replace(/^\w+:\s*/, '')

  if (cleaned.toLowerCase().includes('already registered') || cleaned.toLowerCase().includes('already exists')) {
    return 'An account with this email already exists. Try signing in instead.'
  }
  if (cleaned.toLowerCase().includes('unable to validate email') || cleaned.toLowerCase().includes('invalid email')) {
    return 'Please enter a valid email address.'
  }
  if (cleaned.toLowerCase().includes('signup') && cleaned.toLowerCase().includes('disabled')) {
    return 'Sign up is currently unavailable. Please try again later.'
  }
  if (cleaned.toLowerCase().includes('rate limit') || cleaned.toLowerCase().includes('too many signup')) {
    return 'Too many sign up attempts. Please wait a moment before trying again.'
  }

  return cleaned || 'Sign up failed. Please try again.'
}

const PASSWORD_REQUIREMENTS = [
  { label: 'At least 8 characters', test: (pw: string) => pw.length >= 8 },
  { label: 'At least one uppercase letter', test: (pw: string) => /[A-Z]/.test(pw) },
  { label: 'At least one lowercase letter', test: (pw: string) => /[a-z]/.test(pw) },
  { label: 'At least one number', test: (pw: string) => /[0-9]/.test(pw) },
]

export default function RegisterPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [passwordValue, setPasswordValue] = useState('')
  const [passwordTouched, setPasswordTouched] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const requirementsMet = PASSWORD_REQUIREMENTS.every(r => r.test(passwordValue))

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const form = new FormData(e.currentTarget)
    const email = form.get('email') as string
    const password = form.get('password') as string
    const fullName = form.get('full_name') as string

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, full_name: fullName }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError(parseSignupError(body.error, res.status))
        setLoading(false)
        return
      }

      const { session } = await res.json()

      if (session) {
        router.push('/jobs')
      } else {
        setEmailSent(true)
      }
    } catch (err) {
      console.error('Signup error:', err)
      setError('A network error occurred. Please check your connection and try again.')
      setLoading(false)
    }
  }

  if (emailSent) {
    return (
      <div className="bg-white rounded-xl shadow-[0_20px_60px_rgba(15,23,32,0.14),0_2px_8px_rgba(15,23,32,0.06)] overflow-hidden">
        <div className="p-8 sm:p-10 text-center">
          <h2 className="text-xl font-semibold text-vt-primary mb-2">Check Your Email</h2>
          <p className="text-sm text-vt-muted mt-2">
            We sent a confirmation link to your email address. Click it to activate your account.
          </p>
          <p className="text-sm text-vt-muted mt-4">
            Already confirmed?{' '}
            <Link href="/login" className="text-vt-primary font-semibold hover:text-vt-primary-hover hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-[0_20px_60px_rgba(15,23,32,0.14),0_2px_8px_rgba(15,23,32,0.06)] overflow-hidden">
      <div className="p-8 sm:p-10 flex flex-col gap-5">
        <h2 className="text-center text-xl font-semibold text-vt-primary">Create Your Account</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="full_name" className="text-sm font-semibold text-vt-dark">
              Full Name
            </label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              autoComplete="name"
              required
              disabled={loading}
              className="w-full h-11 rounded-xl border border-vt-border pl-3.5 pr-3.5 text-sm text-vt-dark bg-white focus:outline-none focus:border-vt-primary focus:ring-4 focus:ring-vt-primary/15"
              placeholder="Joe Smith"
            />
          </div>

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

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-semibold text-vt-dark">
              Password
            </label>
            <div className="relative flex items-center">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                disabled={loading}
                value={passwordValue}
                onChange={e => setPasswordValue(e.target.value)}
                onBlur={() => setPasswordTouched(true)}
                className="w-full h-11 rounded-xl border border-vt-border pl-3.5 pr-10 text-sm text-vt-dark bg-white focus:outline-none focus:border-vt-primary focus:ring-4 focus:ring-vt-primary/15"
                placeholder="Create a password"
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

            {(passwordTouched || passwordValue.length > 0) && (
              <ul className="mt-0.5 flex flex-col gap-1">
                {PASSWORD_REQUIREMENTS.map(req => {
                  const met = req.test(passwordValue)
                  return (
                    <li
                      key={req.label}
                      className={`flex items-center gap-1.5 text-xs ${met ? 'text-vt-success' : 'text-vt-muted'}`}
                    >
                      {met ? (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                      ) : (
                        <svg width="6" height="6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /></svg>
                      )}
                      {req.label}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          {error && (
            <p className="text-sm text-vt-error bg-vt-error-bg rounded-xl px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || (passwordValue.length > 0 && !requirementsMet)}
            className="w-full h-[46px] flex items-center justify-center gap-2 bg-vt-primary text-white rounded-xl text-sm font-semibold hover:bg-vt-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading && <Spinner />}
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <OAuthButtons />
      </div>

      <div className="border-t border-[#EEF1F5] px-8 sm:px-10 py-4 text-center">
        <span className="text-sm text-vt-muted-2">Already have an account? </span>
        <Link href="/login" className="text-sm font-semibold text-vt-primary hover:text-vt-primary-hover hover:underline">
          Sign In
        </Link>
      </div>
    </div>
  )
}
