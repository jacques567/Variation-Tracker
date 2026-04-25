import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyCsrfToken } from '@/lib/csrf'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { variationId, clientName, signatureData, csrfToken } = body

    if (!csrfToken) {
      return NextResponse.json(
        { error: 'CSRF token missing' },
        { status: 403 }
      )
    }

    const isValidToken = await verifyCsrfToken(csrfToken)
    if (!isValidToken) {
      return NextResponse.json(
        { error: 'Invalid CSRF token' },
        { status: 403 }
      )
    }

    const supabase = await createClient()

    const { error: sigError } = await supabase.from('signatures').insert({
      variation_id: variationId,
      client_name: clientName.trim(),
      signature_data: signatureData,
    })

    if (sigError) {
      return NextResponse.json(
        { error: 'Failed to save signature' },
        { status: 500 }
      )
    }

    const { error: updateError } = await supabase
      .from('variations')
      .update({ status: 'signed' })
      .eq('id', variationId)

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update variation status' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Signature submission error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
