import Tokens from 'csrf'
import { SupabaseClient } from '@supabase/supabase-js'

const tokens = new Tokens()

function getSecret(): string {
  const secret = process.env.CSRF_SECRET
  if (!secret) {
    throw new Error('CSRF_SECRET environment variable is required. Set it in your .env.local file.')
  }
  return secret
}

export function extractClientIp(xForwardedFor?: string | null, xRealIp?: string | null): string | null {
  if (xForwardedFor) {
    const firstIp = xForwardedFor.split(',')[0]?.trim()
    if (firstIp) return firstIp
  }
  if (xRealIp) {
    const trimmedIp = xRealIp.trim()
    if (trimmedIp) return trimmedIp
  }
  return null
}

export async function generateCsrfToken(
  supabaseClient: SupabaseClient,
  userId?: string,
  clientIp?: string
): Promise<string> {
  const token = tokens.create(getSecret())
  const expiresAt = new Date(Date.now() + 3600000).toISOString() // 1 hour

  const { error } = await supabaseClient.from('csrf_tokens').insert({
    token,
    user_id: userId || null,
    expires_at: expiresAt,
    client_ip: clientIp || null,
  })

  if (error) {
    throw new Error(`Failed to store CSRF token: ${error.message}`)
  }

  return token
}

export async function verifyCsrfToken(
  supabaseClient: SupabaseClient,
  token: string,
  userId?: string
): Promise<boolean> {
  // Atomic verification via RPC: prevents race condition where token could be used twice
  const { data, error } = await supabaseClient.rpc('verify_and_mark_csrf_token', {
    p_token: token,
    p_user_id: userId || null,
  })

  if (error) {
    return false
  }

  if (!data?.is_valid) {
    return false
  }

  // Verify signature with CSRF library (library-level validation)
  const isValid = tokens.verify(getSecret(), token)

  return isValid
}
