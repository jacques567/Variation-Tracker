import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyCsrfToken } from '@/lib/csrf'

export async function POST(request: NextRequest) {
  const { variationId, token, clientName, signatureData, csrfToken } = await request.json()

  if (!variationId || !token || !clientName || !signatureData || !csrfToken) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const isValidCsrf = await verifyCsrfToken(csrfToken)
  if (!isValidCsrf) {
    return NextResponse.json({ error: 'Invalid security token' }, { status: 403 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

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

  if (variation.status === 'signed') {
    return NextResponse.json({ error: 'Already signed' }, { status: 409 })
  }

  const { error: sigError } = await supabase.from('signatures').insert({
    variation_id: variationId,
    client_name: clientName.trim(),
    signature_data: signatureData,
    client_ip: request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? null,
  })

  if (sigError) {
    return NextResponse.json({ error: 'Failed to save signature' }, { status: 500 })
  }

  const { error: updateError } = await supabase
    .from('variations')
    .update({ status: 'signed' })
    .eq('id', variationId)

  if (updateError) {
    return NextResponse.json({ error: 'Failed to update variation status' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
