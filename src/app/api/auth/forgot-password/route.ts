import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const { email } = await request.json()

  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  }

  const supabase = await createClient()

  const { origin } = request.nextUrl
  const redirectTo = `${origin}/api/auth/callback?type=recovery`

  // Always return 200 — do not reveal whether the email is registered
  await supabase.auth.resetPasswordForEmail(email, { redirectTo })

  return NextResponse.json({ ok: true })
}
