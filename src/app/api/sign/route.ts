import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyCsrfToken, extractClientIp } from '@/lib/csrf'

export async function POST(request: NextRequest) {
  try {
    const { variationId, token, clientName, signatureData, csrfToken } = await request.json()

    if (!variationId || !token || !clientName || !signatureData || !csrfToken) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const isValidCsrf = await verifyCsrfToken(supabase, csrfToken)
    if (!isValidCsrf) {
      return NextResponse.json({ error: 'Invalid security token' }, { status: 403 })
    }

    const { data: variation } = await supabase
      .from('variations')
      .select('id, status, signature_token_expires_at')
      .eq('id', variationId)
      .eq('signature_token', token)
      .gt('signature_token_expires_at', new Date().toISOString())
      .single()

    if (!variation) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 403 })
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
      return NextResponse.json({ error: 'Failed to sign variation' }, { status: 500 })
    }

    if (data?.error) {
      if (data.code === 'already_signed') {
        return NextResponse.json({ error: 'Already signed' }, { status: 409 })
      }
      if (data.code === 'not_found') {
        return NextResponse.json({ error: 'Variation not found' }, { status: 404 })
      }
      return NextResponse.json({ error: data.error }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Signature submission error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
