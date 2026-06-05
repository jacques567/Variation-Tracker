import { createServiceRoleClient } from './supabase/server'

export async function checkRateLimit(key: string, maxRequests: number, windowMs: number): Promise<boolean> {
  const supabase = await createServiceRoleClient()
  const now = new Date()
  const windowStart = new Date(now.getTime() - windowMs)

  // Count attempts within the rate limit window
  const { count, error: countError } = await (supabase as any)
    .from('rate_limit_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('endpoint_key', key)
    .gt('attempted_at', windowStart.toISOString())

  if (countError) {
    console.error('Rate limit check failed:', countError)
    throw new Error('Rate limit check unavailable')
  }

  if ((count ?? 0) >= maxRequests) {
    return false // Rate limited
  }

  // Record this attempt
  const { error: insertError } = await (supabase as any)
    .from('rate_limit_attempts')
    .insert({ endpoint_key: key, attempted_at: now.toISOString() })

  if (insertError) {
    console.error('Failed to record rate limit attempt:', insertError)
    throw new Error('Rate limit recording failed')
  }

  // Cleanup old attempts async (non-blocking)
  void (supabase as any)
    .from('rate_limit_attempts')
    .delete()
    .lt('attempted_at', windowStart.toISOString())
    .then(() => {})
    .catch((err: Error) => console.error('Rate limit cleanup failed:', err))

  return true
}
