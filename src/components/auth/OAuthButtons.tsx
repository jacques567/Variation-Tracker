'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const GoogleIcon = (
  <svg className="w-4 h-4" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M23.52 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47c-.28 1.48-1.13 2.73-2.4 3.58v2.98h3.88c2.27-2.09 3.57-5.17 3.57-8.8Z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.87-3c-1.08.72-2.45 1.15-4.06 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.09C3.24 21.3 7.28 24 12 24Z"
    />
    <path
      fill="#FBBC05"
      d="M5.27 14.28A7.2 7.2 0 0 1 4.9 12c0-.79.14-1.56.37-2.28V6.63H1.27A11.98 11.98 0 0 0 0 12c0 1.93.46 3.76 1.27 5.37l4-3.09Z"
    />
    <path
      fill="#EA4335"
      d="M12 4.77c1.77 0 3.35.6 4.6 1.79l3.44-3.44C17.94 1.19 15.24 0 12 0 7.28 0 3.24 2.7 1.27 6.63l4 3.09C6.22 6.88 8.87 4.77 12 4.77Z"
    />
  </svg>
)

export function OAuthButtons({ next }: { next?: string | null }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleGoogleSignIn() {
    setError(null)
    setLoading(true)

    const redirectUrl = new URL('/api/auth/callback', window.location.origin)
    if (next && next.startsWith('/') && !next.startsWith('//')) {
      redirectUrl.searchParams.set('next', next)
    }

    const supabase = createClient()
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: redirectUrl.toString() },
    })

    if (oauthError) {
      setError("Couldn't continue with Google. Please try again.")
      setLoading(false)
    }
    // On success the browser is redirected away by Supabase, so no further state change here.
  }

  return (
    <div>
      <div className="flex items-center gap-3 my-6">
        <div className="h-px flex-1 bg-vt-light" />
        <span className="text-xs text-vt-muted uppercase tracking-wide">or continue with</span>
        <div className="h-px flex-1 bg-vt-light" />
      </div>

      {error && (
        <p className="text-sm text-vt-error bg-vt-error-bg rounded-xl px-3 py-2 mb-4">{error}</p>
      )}

      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 rounded-xl border border-vt-border bg-white px-4 py-2.5 text-sm font-medium text-vt-dark hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {GoogleIcon}
        {loading ? 'Redirecting…' : 'Google'}
      </button>
    </div>
  )
}
