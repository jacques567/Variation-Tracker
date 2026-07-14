import { NextRequest, NextResponse } from 'next/server'
import { Errors } from '@/lib/errors'
import { checkRateLimit } from '@/lib/rate-limit'
import { extractClientIp } from '@/lib/csrf'

const IDEAL_POSTCODES_BASE = 'https://api.ideal-postcodes.co.uk/v1'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const apiKey = process.env.IDEAL_POSTCODES_API_KEY
  if (!apiKey) {
    const err = Errors.serviceUnavailable()
    return NextResponse.json(err.toJSON(), { status: err.statusCode })
  }

  const ip = extractClientIp(request.headers.get('x-forwarded-for'), request.headers.get('x-real-ip')) ?? 'unknown'
  if (!(await checkRateLimit(`address-resolve:${ip}`, 30, 60_000))) {
    const err = Errors.rateLimited()
    return NextResponse.json(err.toJSON(), { status: err.statusCode })
  }

  const { id } = await params
  if (!id) {
    const err = Errors.invalidInput('Address id is required')
    return NextResponse.json(err.toJSON(), { status: err.statusCode })
  }

  try {
    const res = await fetch(
      `${IDEAL_POSTCODES_BASE}/addresses/${encodeURIComponent(id)}?api_key=${encodeURIComponent(apiKey)}`
    )
    const json = await res.json()

    if (res.status === 404) {
      const err = Errors.notFound('Address')
      return NextResponse.json(err.toJSON(), { status: err.statusCode })
    }

    if (!res.ok) {
      const err = Errors.serviceUnavailable()
      return NextResponse.json(err.toJSON(), { status: err.statusCode })
    }

    const a = json.result
    const line1 = [a.line_1, a.line_2].filter(Boolean).join(', ')
    const address = [line1, a.line_3, a.post_town, a.postcode].filter(Boolean).join(', ')

    return NextResponse.json({ address })
  } catch {
    const err = Errors.serviceUnavailable()
    return NextResponse.json(err.toJSON(), { status: err.statusCode })
  }
}
