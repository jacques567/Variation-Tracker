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

  // admin_emails has SELECT USING (false) — the session client can never read it
  // directly (see supabase/migrations/005_fix_signature_token_security.sql and
  // 006_fix_admin_emails_rls_recursion.sql). Use the same is_admin() SECURITY
  // DEFINER RPC that admin/layout.tsx uses, which reads auth.email() from the JWT
  // server-side and bypasses that restriction safely.
  const { data: isAdmin, error: rpcError } = await supabase.rpc('is_admin')

  if (rpcError) {
    console.error('Error checking admin status:', rpcError)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  if (isAdmin) {
    return NextResponse.json({ isAdmin: true })
  }

  return NextResponse.json({ isAdmin: false }, { status: 403 })
}
