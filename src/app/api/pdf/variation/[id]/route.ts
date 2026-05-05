import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { VariationPDF } from '@/components/pdf/VariationPDF'
import { Errors } from '@/lib/errors'
import React from 'react'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      const err = Errors.unauthorized()
      return NextResponse.json(err.toJSON(), { status: err.statusCode })
    }

    const { data: variation } = await supabase
      .from('variations')
      .select('*, job:jobs(*, contractor:contractors(*)), signature:signatures(*)')
      .eq('id', id)
      .single()

    if (!variation || variation.job?.contractor_id !== user.id) {
      const err = Errors.notFound('Variation')
      return NextResponse.json(err.toJSON(), { status: err.statusCode })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buffer = await renderToBuffer(React.createElement(VariationPDF, { variation }) as any)

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="variation-${id.slice(0, 8)}.pdf"`,
      },
    })
  } catch {
    const err = Errors.internalError('Failed to generate PDF')
    return NextResponse.json(err.toJSON(), { status: err.statusCode })
  }
}
