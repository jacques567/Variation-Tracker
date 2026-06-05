'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

/** Clean up Supabase's "field: Message" format and map known errors to user-friendly copy. */
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

  // Strip Supabase "field: " prefix (e.g. "password: Password must contain...")
  const cleaned = apiError.replace(/^\w+:\s*/, '')

  // Map remaining known patterns
  if (cleaned.toLowerCase().includes('already registered') || cleaned.toLowerCase().includes('already exists')) {
    return 'An account with this email already exists. Try signing in instead.'
  }
  if (cleaned.toLowerCase().includes('unable to validate email') || cleaned.toLowerCase().includes('invalid email')) {
    return 'Please enter a valid email address.'
  }
  if (cleaned.toLowerCase().includes('signup') && cleaned.toLowerCase().includes('disabled')) {
    return 'Sign up is currently unavailable. Please try again later.'
  }
  if (cleaned.toLowerCase().includes('rate limit') || cleaned.toLowerCase().includes('too many')) {
    return 'Too many sign up attempts. Please wait a moment before trying again.'
  }

  return cleaned || 'Sign up failed. Please try again.'
}

const PASSWORD_REQUIREMENTS = [
  { label: 'At least 8 characters', test: (pw: string) => pw.length >= 8 },
  { label: 'At least one uppercase letter', test: (pw: string) => /[A-Z]/.test(pw) },
]

export default function RegisterPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [passwordValue, setPasswordValue] = useState('')
  const [passwordTouched, setPasswordTouched] = useState(false)

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
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Check your email</h2>
        <p className="text-sm text-gray-500 mt-2">
          We sent a confirmation link to your email address. Click it to activate your account.
        </p>
        <p className="text-sm text-gray-400 mt-4">
          Already confirmed?{' '}
          <Link href="/login" className="text-blue-600 font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Create your account</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
            Full name
          </label>
          <input
            id="full_name"
            name="full_name"
            type="text"
            required
            disabled={loading}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            placeholder="Joe Smith"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            disabled={loading}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            placeholder="joe@example.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            disabled={loading}
            value={passwordValue}
            onChange={e => setPasswordValue(e.target.value)}
            onBlur={() => setPasswordTouched(true)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            placeholder="Create a password"
          />

          {/* Requirements — shown once user starts typing */}
          {(passwordTouched || passwordValue.length > 0) && (
            <ul className="mt-2 space-y-1">
              {PASSWORD_REQUIREMENTS.map(req => {
                const met = req.test(passwordValue)
                return (
                  <li
                    key={req.label}
                    className={`flex items-center gap-1.5 text-xs ${met ? 'text-green-600' : 'text-gray-400'}`}
                  >
                    <span>{met ? '✓' : '○'}</span>
                    {req.label}
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || (passwordValue.length > 0 && !requirementsMet)}
          className="w-full bg-blue-600 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <p className="text-sm text-gray-500 text-center mt-6">
        Already have an account?{' '}
        <Link href="/login" className="text-blue-600 font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
