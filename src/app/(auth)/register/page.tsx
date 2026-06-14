'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import NextLink from 'next/link'
import { Button } from '@/components/primitives/Button'
import { Input } from '@/components/primitives/Input'
import { FormGroup } from '@/components/primitives/FormGroup'
import { Card } from '@/components/primitives/Card'
import { ErrorMessage } from '@/components/primitives/ErrorMessage'

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
      <Card variant="form">
        <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-bold)', marginBottom: 'var(--spacing-sm)', textAlign: 'center' }}>
          Check your email
        </h2>
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginTop: 'var(--spacing-md)' }}>
          We sent a confirmation link to your email address. Click it to activate your account.
        </p>
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-tertiary)', marginTop: 'var(--spacing-lg)', textAlign: 'center' }}>
          Already confirmed?{' '}
          <NextLink href="/login" className="link">
            Sign in
          </NextLink>
        </p>
      </Card>
    )
  }

  return (
    <Card variant="form">
      <h2 style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--spacing-lg)' }}>
        Create your account
      </h2>

      <form onSubmit={handleSubmit}>
        <FormGroup label="Full name">
          <Input
            id="full_name"
            name="full_name"
            type="text"
            required
            disabled={loading}
            placeholder="Joe Smith"
          />
        </FormGroup>

        <FormGroup label="Email address">
          <Input
            id="email"
            name="email"
            type="email"
            required
            disabled={loading}
            placeholder="joe@example.com"
          />
        </FormGroup>

        <FormGroup label="Password">
          <Input
            id="password"
            name="password"
            type="password"
            required
            disabled={loading}
            value={passwordValue}
            onChange={e => setPasswordValue(e.target.value)}
            onBlur={() => setPasswordTouched(true)}
            placeholder="Create a password"
          />

          {/* Requirements — shown once user starts typing */}
          {(passwordTouched || passwordValue.length > 0) && (
            <ul style={{ marginTop: 'var(--spacing-md)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
              {PASSWORD_REQUIREMENTS.map(req => {
                const met = req.test(passwordValue)
                return (
                  <li
                    key={req.label}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--spacing-xs)',
                      fontSize: 'var(--font-size-xs)',
                      color: met ? 'var(--color-primary)' : 'var(--color-text-tertiary)',
                    }}
                  >
                    <span>{met ? '✓' : '○'}</span>
                    {req.label}
                  </li>
                )
              })}
            </ul>
          )}
        </FormGroup>

        {error && <ErrorMessage>{error}</ErrorMessage>}

        <Button
          type="submit"
          disabled={loading || (passwordValue.length > 0 && !requirementsMet)}
          style={{ width: '100%', marginTop: 'var(--spacing-lg)' }}
        >
          {loading ? 'Creating account...' : 'Create account'}
        </Button>
      </form>

      <p style={{
        fontSize: 'var(--font-size-sm)',
        color: 'var(--color-text-secondary)',
        textAlign: 'center',
        marginTop: 'var(--spacing-2xl)',
      }}>
        Already have an account?{' '}
        <NextLink href="/login" className="link">
          Sign in
        </NextLink>
      </p>
    </Card>
  )
}
