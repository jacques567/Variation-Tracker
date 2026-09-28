import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { checkSubscription } from '@/lib/subscription-guard'
import { Errors } from '@/lib/errors'

function errorResponse(err: unknown) {
  if (err instanceof Error && 'statusCode' in err && typeof err.statusCode === 'number') {
    return NextResponse.json((err as any).toJSON(), { status: err.statusCode })
  }
  return NextResponse.json(Errors.internalError().toJSON(), { status: 500 })
}

/**
 * PATCH /api/jobs/[id]
 *
 * Updates editable job fields. Currently supports: client_email.
 * Only the authenticated contractor who owns the job may update it.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(Errors.unauthorized().toJSON(), { status: 401 })
    }

    const body = await request.json()
    const { client_email } = body

    if (!client_email || typeof client_email !== 'string') {
      return NextResponse.json(Errors.missingFields(['client_email']).toJSON(), { status: 400 })
    }

    // Basic email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(client_email)) {
      return NextResponse.json(Errors.invalidInput('Invalid email address').toJSON(), { status: 400 })
    }

    const { error: updateError } = await supabase
      .from('jobs')
      .update({ client_email: client_email.trim().toLowerCase() })
      .eq('id', jobId)
      .eq('contractor_id', user.id)

    if (updateError) {
      console.error('Job update error:', updateError)
      return NextResponse.json(Errors.databaseError().toJSON(), { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Job patch error:', error)
    return NextResponse.json(Errors.internalError().toJSON(), { status: 500 })
  }
}

/**
 * DELETE /api/jobs/[id]
 *
 * Deletes a job and all associated data:
 *  1. Fetches all variation photo URLs for the job
 *  2. Deletes photos from Supabase Storage
 *  3. Deletes the job row (DB cascades handle variations + signatures)
 *
 * Only the authenticated contractor who owns the job may delete it.
 *
 * A job with any signed variation cannot be hard-deleted — signed records
 * are retained for 6 years (see the privacy policy's retention section).
 * We check that up front for a friendly error message; the DB trigger in
 * 20260928120000_retain_signed_jobs.sql is the backstop for any other path.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params

    // Auth check — use the user's session
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(Errors.unauthorized().toJSON(), { status: 401 })
    }

    const { isValid, reason } = await checkSubscription(user.id)
    if (!isValid) {
      const err = Errors.forbidden(reason)
      return NextResponse.json(err.toJSON(), { status: err.statusCode })
    }

    // Service client for storage operations (bypasses RLS)
    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Verify ownership and fetch photo URLs + variation status in one query
    const { data: job, error: jobError } = await serviceClient
      .from('jobs')
      .select('id, contractor_id, variations(photo_url, status)')
      .eq('id', jobId)
      .eq('contractor_id', user.id)
      .single()

    if (jobError || !job) {
      return NextResponse.json(Errors.notFound('Job').toJSON(), { status: 404 })
    }

    const jobVariations = job.variations as { photo_url: string | null; status: string }[]

    // Signed variations are a retained contractual record (6 years — see the
    // privacy policy). Deleting the job would destroy them via cascade, so
    // we steer the user to archiving instead.
    if (jobVariations.some((v) => v.status === 'signed')) {
      return NextResponse.json(
        Errors.conflict(
          'This job has signed variations, which are kept as a legal record. Archive the job instead of deleting it.'
        ).toJSON(),
        { status: 409 }
      )
    }

    // Delete photos from Storage (best-effort — don't block deletion if storage fails)
    const photoUrls: string[] = jobVariations
      .map((v) => v.photo_url)
      .filter((url): url is string => !!url)

    if (photoUrls.length > 0) {
      // Extract storage paths from public URLs
      // URL format: .../storage/v1/object/public/variation-photos/<path>
      const storagePaths = photoUrls
        .map((url) => {
          const match = url.match(/variation-photos\/(.+)$/)
          return match ? match[1] : null
        })
        .filter((path): path is string => !!path)

      if (storagePaths.length > 0) {
        const { error: storageError } = await serviceClient.storage
          .from('variation-photos')
          .remove(storagePaths)

        if (storageError) {
          console.error('Storage cleanup error (non-fatal):', storageError)
        }
      }
    }

    // Delete the job — DB cascades handle variations, signatures
    const { error: deleteError } = await serviceClient
      .from('jobs')
      .delete()
      .eq('id', jobId)
      .eq('contractor_id', user.id)

    if (deleteError) {
      console.error('Job deletion error:', deleteError)
      return errorResponse(Errors.databaseError())
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Job delete error:', error)
    return errorResponse(error)
  }
}
