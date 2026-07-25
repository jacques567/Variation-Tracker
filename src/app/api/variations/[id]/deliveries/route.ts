import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { verifyCsrfToken, extractClientIp } from '@/lib/csrf'
import { Errors } from '@/lib/errors'
import { checkRateLimit } from '@/lib/rate-limit'

// Channels the contractor can record. 'share_sheet' and 'link_copied' are
// logged by the app itself when those actions fire; the rest are declared.
const DeliverySchema = z.object({
  channel: z.enum([
    'email',
    'whatsapp',
    'sms',
    'share_sheet',
    'link_copied',
    'in_person',
    'other',
  ]),
  recipient: z.string().max(320).optional().nullable(),
  note: z.string().max(500).optional().nullable(),
  csrfToken: z.string().min(1, 'CSRF token missing'),
})

function errorResponse(err: unknown) {
  if (err instanceof Error && 'statusCode' in err && typeof err.statusCode === 'number') {
    const e = err as Error & { statusCode: number; toJSON(): object }
    return NextResponse.json(e.toJSON(), { status: e.statusCode })
  }
  return NextResponse.json(Errors.internalError().toJSON(), { status: 500 })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ip = extractClientIp(
    request.headers.get('x-forwarded-for'),
    request.headers.get('x-real-ip')
  )

  if (!(await checkRateLimit(`delivery:${ip ?? 'unknown'}`, 30, 60_000))) {
    return errorResponse(Errors.rateLimited())
  }

  try {
    const { id } = await params
    const { channel, recipient, note, csrfToken } = DeliverySchema.parse(await request.json())

    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (!user || authError) {
      return errorResponse(Errors.unauthorized())
    }

    if (!(await verifyCsrfToken(supabase, csrfToken, user.id))) {
      return errorResponse(Errors.invalidToken())
    }

    // RLS enforces that the variation belongs to this contractor, and that
    // recorded_by matches the authenticated user. No ownership check is
    // duplicated here — the policy is the single gate.
    const { error } = await supabase.from('variation_deliveries').insert({
      variation_id: id,
      channel,
      recipient: recipient?.trim() || null,
      note: note?.trim() || null,
      evidence_source: 'declared',
      recorded_by: user.id,
      client_ip: ip,
      user_agent: request.headers.get('user-agent')?.slice(0, 500) ?? null,
    })

    if (error) {
      console.error('Delivery record insert failed:', error)
      return errorResponse(Errors.databaseError())
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(Errors.invalidInput(error.issues[0]?.message || 'Invalid input'))
    }
    console.error('Delivery record error:', error)
    return errorResponse(error)
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (!user || authError) {
      return errorResponse(Errors.unauthorized())
    }

    const { data, error } = await supabase
      .from('variation_deliveries')
      .select('id, channel, recipient, note, evidence_source, sent_at')
      .eq('variation_id', id)
      .order('sent_at', { ascending: false })

    if (error) {
      return errorResponse(Errors.databaseError())
    }

    return NextResponse.json({ deliveries: data ?? [] })
  } catch (error) {
    console.error('Delivery fetch error:', error)
    return errorResponse(error)
  }
}
