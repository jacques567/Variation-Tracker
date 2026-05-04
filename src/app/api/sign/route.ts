import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyCsrfToken, extractClientIp } from '@/lib/csrf'
import { Errors } from '@/lib/errors'

function errorResponse(err: unknown) {
  if (err instanceof Error && 'statusCode' in err && typeof err.statusCode === 'number') {
    return NextResponse.json((err as any).toJSON(), { status: err.statusCode })
  }
  return NextResponse.json(Errors.internalError().toJSON(), { status: 500 })
}

export async function POST(request: NextRequest) {
  try {
    const { variationId, token, clientName, signatureData, csrfToken } = await request.json()

    if (!variationId || !token || !clientName || !signatureData || !csrfToken) {
      const err = Errors.missingFields(['variationId', 'token', 'clientName', 'signatureData', 'csrfToken'])
      return errorResponse(err)
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const isValidCsrf = await verifyCsrfToken(supabase, csrfToken)
    if (!isValidCsrf) {
      const err = Errors.invalidToken()
      return errorResponse(err)
    }

    const { data: variation } = await supabase
      .from('variations')
      .select('id, status, signature_token_expires_at')
      .eq('id', variationId)
      .eq('signature_token', token)
      .gt('signature_token_expires_at', new Date().toISOString())
      .single()

    if (!variation) {
      const err = Errors.expiredToken('Variation link has expired')
      return errorResponse(err)
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
      const err = Errors.databaseError()
      return errorResponse(err)
    }

    if (data?.error) {
      if (data.code === 'already_signed') {
        const err = Errors.conflict('Variation has already been signed')
        return errorResponse(err)
      }
      if (data.code === 'not_found') {
        const err = Errors.notFound('Variation')
        return errorResponse(err)
      }
      const err = Errors.invalidInput(data.error)
      return errorResponse(err)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Signature submission error:', error)
    return errorResponse(error)
  }
}
