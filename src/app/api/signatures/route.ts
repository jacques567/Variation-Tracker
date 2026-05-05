import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { verifyCsrfToken, extractClientIp } from '@/lib/csrf'
import { Errors } from '@/lib/errors'

const SignatureSchema = z.object({
  variationId: z.string().uuid('Invalid variation ID format'),
  clientName: z.string().trim().min(1, 'Name required').max(255, 'Name too long'),
  signatureData: z
    .string()
    .regex(/^data:image\/png;base64,/, 'Invalid signature data format')
    .max(5000000, 'Signature data too large (max 5MB)'),
  csrfToken: z.string().min(1, 'CSRF token missing'),
})

function errorResponse(err: unknown) {
  if (err instanceof Error && 'statusCode' in err && typeof err.statusCode === 'number') {
    return NextResponse.json((err as Error & { statusCode: number; toJSON(): object }).toJSON(), { status: (err as Error & { statusCode: number }).statusCode })
  }
  return NextResponse.json(Errors.internalError().toJSON(), { status: 500 })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { variationId, clientName, signatureData, csrfToken } = SignatureSchema.parse(body)

    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (!user || authError) {
      return errorResponse(Errors.unauthorized())
    }

    const isValidToken = await verifyCsrfToken(supabase, csrfToken, user.id)
    if (!isValidToken) {
      return errorResponse(Errors.invalidToken())
    }

    const { data: variation, error: varError } = await supabase
      .from('variations')
      .select('id, job_id')
      .eq('id', variationId)
      .single()

    if (!variation || varError) {
      return errorResponse(Errors.notFound('Variation'))
    }

    if (!variation.job_id) {
      return errorResponse(Errors.internalError('Variation has no associated job', false))
    }

    const { data: job } = await supabase
      .from('jobs')
      .select('contractor_id')
      .eq('id', variation.job_id)
      .single()

    if (!job || job.contractor_id !== user.id) {
      return errorResponse(Errors.forbidden())
    }

    const clientIp = extractClientIp(
      request.headers.get('x-forwarded-for'),
      request.headers.get('x-real-ip')
    )

    const { data, error } = await supabase.rpc('sign_variation', {
      p_variation_id: variationId,
      p_client_name: clientName.trim(),
      p_signature_data: signatureData,
      p_client_ip: clientIp,
    })

    if (error) {
      console.error('RPC error:', error)
      return errorResponse(Errors.databaseError())
    }

    if (data?.error) {
      if (data.code === 'already_signed') {
        return errorResponse(Errors.conflict('Variation has already been signed'))
      }
      if (data.code === 'not_found') {
        return errorResponse(Errors.notFound('Variation'))
      }
      return errorResponse(Errors.invalidInput(data.error))
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.issues[0]?.message || 'Invalid input'
      return errorResponse(Errors.invalidInput(message))
    }
    console.error('Signature submission error:', error)
    return errorResponse(error)
  }
}
