import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { Errors } from '@/lib/errors'

function errorResponse(err: unknown) {
  if (err instanceof Error && 'statusCode' in err && typeof err.statusCode === 'number') {
    return NextResponse.json((err as any).toJSON(), { status: err.statusCode })
  }
  return NextResponse.json(Errors.internalError().toJSON(), { status: 500 })
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

    // Service client for storage operations (bypasses RLS)
    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Verify ownership and fetch photo URLs in one query
    const { data: job, error: jobError } = await serviceClient
      .from('jobs')
      .select('id, contractor_id, variations(photo_url)')
      .eq('id', jobId)
      .eq('contractor_id', user.id)
      .single()

    if (jobError || !job) {
      return NextResponse.json(Errors.notFound('Job').toJSON(), { status: 404 })
    }

    // Delete photos from Storage (best-effort — don't block deletion if storage fails)
    const photoUrls: string[] = (job.variations as { photo_url: string | null }[])
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
