import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateCsrfToken, extractClientIp } from '@/lib/csrf'
import { Errors } from '@/lib/errors'
import { checkRateLimit } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
  const ip = extractClientIp(request.headers.get('x-forwarded-for'), request.headers.get('x-real-ip')) ?? 'unknown'
  if (!checkRateLimit(`csrf:${ip}`, 20, 60_000)) {
    const err = Errors.rateLimited()
    return NextResponse.json(err.toJSON(), { status: err.statusCode })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: { session } } = await supabase.auth.getSession()
  const userId = session?.user?.id

  const clientIp = extractClientIp(
    request.headers.get('x-forwarded-for'),
    request.headers.get('x-real-ip')
  ) ?? undefined

  try {
    const token = await generateCsrfToken(supabase, userId || undefined, clientIp || undefined)
    return NextResponse.json({ csrfToken: token })
  } catch (error) {
    const err = Errors.databaseError(true)
    return NextResponse.json(err.toJSON(), { status: err.statusCode })
  }
}
