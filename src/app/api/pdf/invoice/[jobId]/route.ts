import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { InvoicePDF } from '@/components/pdf/InvoicePDF'
import { Errors } from '@/lib/errors'
import React from 'react'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      const err = Errors.unauthorized()
      return NextResponse.json(err.toJSON(), { status: err.statusCode })
    }

    const { data: job } = await supabase
      .from('jobs')
      .select('*, contractor:contractors(*), variations(*, signature:signatures(*))')
      .eq('id', jobId)
      .eq('contractor_id', user.id)
      .single()

    if (!job) {
      const err = Errors.notFound('Job')
      return NextResponse.json(err.toJSON(), { status: err.statusCode })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buffer = await renderToBuffer(React.createElement(InvoicePDF, { job }) as any)

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${jobId.slice(0, 8)}.pdf"`,
      },
    })
  } catch {
    const err = Errors.internalError('Failed to generate PDF')
    return NextResponse.json(err.toJSON(), { status: err.statusCode })
  }
}
