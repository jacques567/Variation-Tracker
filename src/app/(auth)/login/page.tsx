'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import NextLink from 'next/link'
import { Button } from '@/components/primitives/Button'
import { Input } from '@/components/primitives/Input'
import { FormGroup } from '@/components/primitives/FormGroup'
import { Card } from '@/components/primitives/Card'
import { ErrorMessage } from '@/components/primitives/ErrorMessage'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

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

      const { session } = await res.json()

      // Check if user is admin
      const adminRes = await fetch('/api/admin/check-admin', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

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
    <Card variant="form">
      <h2 style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--spacing-lg)' }}>
        Sign in
      </h2>

      {callbackError === 'auth_callback_failed' && (
        <ErrorMessage>
          The confirmation link is invalid or has expired. Please try again.
        </ErrorMessage>
      )}

      <form onSubmit={handleSubmit}>
        <FormGroup label="Email address">
          <Input
            id="email"
            name="email"
            type="email"
            required
            placeholder="joe@example.com"
            disabled={loading}
          />
        </FormGroup>

        <FormGroup label="Password">
          <Input
            id="password"
            name="password"
            type="password"
            required
            disabled={loading}
          />
          <div style={{ marginTop: 'var(--spacing-sm)' }}>
            <NextLink href="/forgot-password" className="link" style={{ fontSize: 'var(--font-size-sm)' }}>
              Forgot password?
            </NextLink>
          </div>
        </FormGroup>

        {error && <ErrorMessage>{error}</ErrorMessage>}

        <Button
          type="submit"
          disabled={loading}
          style={{ width: '100%', marginTop: 'var(--spacing-lg)' }}
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>

      <p style={{
        fontSize: 'var(--font-size-sm)',
        color: 'var(--color-text-secondary)',
        textAlign: 'center',
        marginTop: 'var(--spacing-2xl)',
      }}>
        Don&apos;t have an account?{' '}
        <NextLink href="/register" className="link">
          Create one free
        </NextLink>
      </p>
    </Card>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
