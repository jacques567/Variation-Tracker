'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Spinner } from '@/components/ui/Spinner'

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
      <div className="bg-white rounded-xl shadow-[0_20px_60px_rgba(15,23,32,0.14),0_2px_8px_rgba(15,23,32,0.06)] overflow-hidden">
        <div className="p-8 sm:p-10 text-center">
          <p className="text-sm text-vt-muted">Verifying your link…</p>
        </div>
      </div>
    )
  }

  if (pageState === 'expired') {
    return (
      <div className="bg-white rounded-xl shadow-[0_20px_60px_rgba(15,23,32,0.14),0_2px_8px_rgba(15,23,32,0.06)] overflow-hidden">
        <div className="p-8 sm:p-10 text-center">
          <h2 className="text-xl font-semibold text-vt-primary mb-3">Link Expired</h2>
          <p className="text-sm text-vt-muted mb-6">
            This password reset link has expired or already been used.
          </p>
          <Link href="/forgot-password" className="text-sm font-semibold text-vt-primary hover:text-vt-primary-hover hover:underline">
            Request a new link
          </Link>
        </div>
      </div>
    )
  }

  if (pageState === 'success') {
    return (
      <div className="bg-white rounded-xl shadow-[0_20px_60px_rgba(15,23,32,0.14),0_2px_8px_rgba(15,23,32,0.06)] overflow-hidden">
        <div className="p-8 sm:p-10 text-center">
          <h2 className="text-xl font-semibold text-vt-primary mb-3">Password Updated</h2>
          <p className="text-sm text-vt-muted">Signing you in…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-[0_20px_60px_rgba(15,23,32,0.14),0_2px_8px_rgba(15,23,32,0.06)] overflow-hidden">
      <div className="p-8 sm:p-10 flex flex-col gap-6">
        <h2 className="text-center text-xl font-semibold text-vt-primary">Set New Password</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-semibold text-vt-dark">
              New Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              disabled={loading}
              className="w-full h-11 rounded-xl border border-vt-border pl-3.5 pr-3.5 text-sm text-vt-dark bg-white focus:outline-none focus:border-vt-primary focus:ring-4 focus:ring-vt-primary/15"
              placeholder="Minimum 8 characters"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="confirm" className="text-sm font-semibold text-vt-dark">
              Confirm New Password
            </label>
            <input
              id="confirm"
              name="confirm"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              disabled={loading}
              className="w-full h-11 rounded-xl border border-vt-border pl-3.5 pr-3.5 text-sm text-vt-dark bg-white focus:outline-none focus:border-vt-primary focus:ring-4 focus:ring-vt-primary/15"
              placeholder="Re-enter your password"
            />
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
            {loading ? 'Saving…' : 'Set New Password'}
          </button>
        </form>
      </div>
    </div>
  )
}
