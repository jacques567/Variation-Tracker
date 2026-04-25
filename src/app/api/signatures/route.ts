import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { verifyCsrfToken } from '@/lib/csrf'

const SignatureSchema = z.object({
  variationId: z.string().uuid('Invalid variation ID format'),
  clientName: z.string().trim().min(1, 'Name required').max(255, 'Name too long'),
  signatureData: z
    .string()
    .regex(/^data:image\/png;base64,/, 'Invalid signature data format')
    .max(5000000, 'Signature data too large (max 5MB)'),
  csrfToken: z.string().min(1, 'CSRF token missing'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { variationId, clientName, signatureData, csrfToken } = SignatureSchema.parse(body)

    const isValidToken = await verifyCsrfToken(csrfToken)
    if (!isValidToken) {
      return NextResponse.json(
        { error: 'Invalid CSRF token' },
        { status: 403 }
      )
    }

    const supabase = await createClient()

    const { data: variation, error: varError } = await supabase
      .from('variations')
      .select('id')
      .eq('id', variationId)
      .single()

    if (!variation || varError) {
      return NextResponse.json(
        { error: 'Variation not found' },
        { status: 404 }
      )
    }

    const { error: sigError } = await supabase.from('signatures').insert({
      variation_id: variationId,
      client_name: clientName,
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
    if (error instanceof z.ZodError) {
      const message = error.issues[0]?.message || 'Invalid input'
      return NextResponse.json(
        { error: message },
        { status: 400 }
      )
    }
    console.error('Signature submission error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
