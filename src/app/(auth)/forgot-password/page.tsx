'use client'

import { useState } from 'react'
import NextLink from 'next/link'
import { Button } from '@/components/primitives/Button'
import { Input } from '@/components/primitives/Input'
import { FormGroup } from '@/components/primitives/FormGroup'
import { Card } from '@/components/primitives/Card'
import { ErrorMessage } from '@/components/primitives/ErrorMessage'

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
      <Card variant="form">
        <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-bold)', marginBottom: 'var(--spacing-md)', textAlign: 'center' }}>
          Check your email
        </h2>
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-lg)' }}>
          If that address is registered, you&apos;ll receive a password reset link shortly.
        </p>
        <div style={{ textAlign: 'center' }}>
          <NextLink href="/login" className="link" style={{ fontSize: 'var(--font-size-sm)' }}>
            Back to sign in
          </NextLink>
        </div>
      </Card>
    )
  }

  return (
    <Card variant="form">
      <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-bold)', marginBottom: 'var(--spacing-sm)' }}>
        Reset your password
      </h2>
      <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-lg)' }}>
        Enter your email and we&apos;ll send you a reset link.
      </p>

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

        {error && <ErrorMessage>{error}</ErrorMessage>}

        <Button
          type="submit"
          disabled={loading}
          style={{ width: '100%', marginTop: 'var(--spacing-lg)' }}
        >
          {loading ? 'Sending...' : 'Send reset link'}
        </Button>
      </form>

      <p style={{
        fontSize: 'var(--font-size-sm)',
        color: 'var(--color-text-secondary)',
        textAlign: 'center',
        marginTop: 'var(--spacing-2xl)',
      }}>
        <NextLink href="/login" className="link">
          Back to sign in
        </NextLink>
      </p>
    </Card>
  )
}
