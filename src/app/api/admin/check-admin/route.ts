import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user || !user.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: adminEmail, error: queryError } = await supabase
    .from('admin_emails')
    .select('email')
    .eq('email', user.email)
    .maybeSingle()

  if (queryError && queryError.code !== 'PGRST116') {
    console.error('Error checking admin status:', queryError)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  if (adminEmail) {
    return NextResponse.json({ isAdmin: true })
  }

  return NextResponse.json({ isAdmin: false }, { status: 403 })
}
