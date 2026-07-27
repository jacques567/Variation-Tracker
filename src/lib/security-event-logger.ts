import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'

export type SecurityEventType =
  | 'auth.login'
  | 'auth.signup'
  | 'csrf.verify'
  | 'signature.reject'

interface SecurityEventLog {
  event_type: SecurityEventType
  status: 'success' | 'failed'
  error_message: string | null
  contractor_id: string | null
  client_ip: string | null
  metadata: Record<string, unknown>
  logged_at: string
}

/**
 * Structured logging for security-relevant failures (auth, CSRF, signature
 * rejections) that would otherwise only reach console.error and vanish in
 * production. Same pattern as webhook-logger.ts's stripe_webhook_logs table —
 * never throws, since a logging failure must not break the request it's logging.
 */
export async function logSecurityEvent(
  eventType: SecurityEventType,
  status: 'success' | 'failed',
  options: {
    errorMessage?: string | null
    contractorId?: string | null
    clientIp?: string | null
    metadata?: Record<string, unknown>
  } = {}
): Promise<void> {
  try {
    const supabase = createSupabaseAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const log: SecurityEventLog = {
      event_type: eventType,
      status,
      error_message: options.errorMessage ?? null,
      contractor_id: options.contractorId ?? null,
      client_ip: options.clientIp ?? null,
      metadata: options.metadata ?? {},
      logged_at: new Date().toISOString(),
    }

    const { error } = await supabase.from('security_event_logs').insert([log])

    if (error) {
      console.error('Failed to log security event:', error)
    }
  } catch (error) {
    console.error('Security event logging error:', error)
  }
}
