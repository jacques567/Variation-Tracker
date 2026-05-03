import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateCsrfToken, extractClientIp } from '@/lib/csrf'

export async function GET(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Get user session if available (for user-bound tokens)
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
    return NextResponse.json(
      {
        error: 'token_generation_failed',
        message: 'Failed to generate security token. Please try again.',
        retryable: true,
      },
      { status: 500 }
    )
  }
}
