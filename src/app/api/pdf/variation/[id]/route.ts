import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { VariationPDF } from '@/components/pdf/VariationPDF'
import React from 'react'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: variation } = await supabase
    .from('variations')
    .select('*, job:jobs(*, contractor:contractors(*)), signature:signatures(*)')
    .eq('id', id)
    .single()

  if (!variation || variation.job?.contractor_id !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(React.createElement(VariationPDF, { variation }) as any)

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="variation-${id.slice(0, 8)}.pdf"`,
    },
  })
}
