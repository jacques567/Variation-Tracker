import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { verifyCsrfToken } from '@/lib/csrf'
import { Errors } from '@/lib/errors'

const NotesSchema = z.object({
  notes: z.string().max(2000, 'Notes too long'),
  csrfToken: z.string().min(1, 'CSRF token missing'),
})

function errorResponse(err: unknown) {
  if (err instanceof Error && 'statusCode' in err && typeof err.statusCode === 'number') {
    return NextResponse.json((err as Error & { statusCode: number; toJSON(): object }).toJSON(), { status: (err as Error & { statusCode: number }).statusCode })
  }
  return NextResponse.json(Errors.internalError().toJSON(), { status: 500 })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { notes, csrfToken } = NotesSchema.parse(body)

    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (!user || !user.email || authError) {
      return errorResponse(Errors.unauthorized())
    }

    const isValidToken = await verifyCsrfToken(supabase, csrfToken, user.id)
    if (!isValidToken) {
      return errorResponse(Errors.invalidToken())
    }

    // Use SECURITY DEFINER RPC — admin_emails SELECT is blocked by RLS (USING false).
    const { data: isAdmin } = await supabase.rpc('is_admin')
    if (!isAdmin) {
      return errorResponse(Errors.forbidden())
    }

    const { error } = await supabase
      .from('signatures')
      .update({ admin_notes: notes })
      .eq('id', id)

    if (error) {
      return errorResponse(Errors.databaseError())
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.issues[0]?.message || 'Invalid input'
      return errorResponse(Errors.invalidInput(message))
    }
    console.error('Notes update error:', error)
    return errorResponse(error)
  }
}
