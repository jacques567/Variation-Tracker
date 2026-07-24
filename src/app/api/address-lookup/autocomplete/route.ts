import { NextRequest, NextResponse } from 'next/server'
import { Errors } from '@/lib/errors'
import { checkRateLimit } from '@/lib/rate-limit'
import { extractClientIp } from '@/lib/csrf'

const IDEAL_POSTCODES_BASE = 'https://api.ideal-postcodes.co.uk/v1'

export async function GET(request: NextRequest) {
  const apiKey = process.env.IDEAL_POSTCODES_API_KEY
  if (!apiKey) {
    const err = Errors.serviceUnavailable()
    return NextResponse.json(err.toJSON(), { status: err.statusCode })
  }

  const ip = extractClientIp(request.headers.get('x-forwarded-for'), request.headers.get('x-real-ip')) ?? 'unknown'
  if (!(await checkRateLimit(`address-autocomplete:${ip}`, 30, 60_000))) {
    const err = Errors.rateLimited()
    return NextResponse.json(err.toJSON(), { status: err.statusCode })
  }

  const query = request.nextUrl.searchParams.get('query')?.trim()
  if (!query) {
    const err = Errors.invalidInput('Query is required')
    return NextResponse.json(err.toJSON(), { status: err.statusCode })
  }

  try {
    const res = await fetch(
      `${IDEAL_POSTCODES_BASE}/autocomplete/addresses?api_key=${encodeURIComponent(apiKey)}&query=${encodeURIComponent(query)}`
    )
    const json = await res.json()

    if (!res.ok) {
      const err = Errors.serviceUnavailable()
      return NextResponse.json(err.toJSON(), { status: err.statusCode })
    }

    const suggestions = (json.result?.hits ?? []).map((hit: { udprn: string; suggestion: string }) => ({
      id: hit.udprn,
      suggestion: hit.suggestion,
    }))

    return NextResponse.json({ suggestions })
  } catch {
    const err = Errors.serviceUnavailable()
    return NextResponse.json(err.toJSON(), { status: err.statusCode })
  }
}
