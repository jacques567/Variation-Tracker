'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type PageState = 'checking' | 'ready' | 'expired' | 'success'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [pageState, setPageState] = useState<PageState>('checking')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function checkSession() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      setPageState(session ? 'ready' : 'expired')
    }
    checkSession()
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const form = new FormData(e.currentTarget)
    const password = form.get('password') as string
    const confirm = form.get('confirm') as string

    if (password !== confirm) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setPageState('success')
    setTimeout(() => router.push('/jobs'), 2000)
  }

  if (pageState === 'checking') {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
        <p className="text-sm text-gray-500">Verifying your link...</p>
      </div>
    )
  }

  if (pageState === 'expired') {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">Link expired</h2>
        <p className="text-sm text-gray-600 mb-6">
          This password reset link has expired or already been used.
        </p>
        <Link href="/forgot-password" className="text-sm text-blue-600 font-medium hover:underline">
          Request a new link
        </Link>
      </div>
    )
  }

  if (pageState === 'success') {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">Password updated</h2>
        <p className="text-sm text-gray-600">Signing you in...</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Set new password</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            New password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Minimum 8 characters"
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="confirm" className="block text-sm font-medium text-gray-700 mb-1">
            Confirm new password
          </label>
          <input
            id="confirm"
            name="confirm"
            type="password"
            required
            minLength={8}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Saving...' : 'Set new password'}
        </button>
      </form>
    </div>
  )
}
