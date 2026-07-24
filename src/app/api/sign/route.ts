import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyCsrfToken, extractClientIp } from '@/lib/csrf'
import { Errors } from '@/lib/errors'
import { checkRateLimit } from '@/lib/rate-limit'
import { sendSignatureConfirmation, sendVariationSignedNotice } from '@/lib/email'

function errorResponse(err: unknown) {
  if (err instanceof Error && 'statusCode' in err && typeof err.statusCode === 'number') {
    return NextResponse.json((err as any).toJSON(), { status: err.statusCode })
  }
  return NextResponse.json(Errors.internalError().toJSON(), { status: 500 })
}

export async function POST(request: NextRequest) {
  const ip = extractClientIp(request.headers.get('x-forwarded-for'), request.headers.get('x-real-ip')) ?? 'unknown'
  if (!(await checkRateLimit(`sign:${ip}`, 10, 60_000))) {
    const err = Errors.rateLimited()
    return NextResponse.json(err.toJSON(), { status: err.statusCode })
  }

  try {
    const { variationId, token, clientName, signatureData, csrfToken, declarationText } = await request.json()

    if (!variationId || !token || !clientName || !signatureData || !csrfToken) {
      const err = Errors.missingFields(['variationId', 'token', 'clientName', 'signatureData', 'csrfToken'])
      return errorResponse(err)
    }

    // The declaration is the consent itself — it must be recorded verbatim.
    // Refuse rather than store a signature with no provable wording.
    if (typeof declarationText !== 'string' || declarationText.trim().length === 0) {
      const err = Errors.missingFields(['declarationText'])
      return errorResponse(err)
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const isValidCsrf = await verifyCsrfToken(supabase, csrfToken)
    if (!isValidCsrf) {
      const err = Errors.invalidToken()
      return errorResponse(err)
    }

    const { data: variation } = await supabase
      .from('variations')
      .select('id, status, signature_token_expires_at')
      .eq('id', variationId)
      .eq('signature_token', token)
      .gt('signature_token_expires_at', new Date().toISOString())
      .single()

    if (!variation) {
      const err = Errors.expiredToken('Variation link has expired')
      return errorResponse(err)
    }

    const clientIp = extractClientIp(
      request.headers.get('x-forwarded-for'),
      request.headers.get('x-real-ip')
    )

    // IP should always be present on Vercel (x-forwarded-for is injected by the
    // CDN). Log a warning if missing so missing IPs are visible in logs.
    if (!clientIp) {
      console.warn('[sign] client IP not captured — x-forwarded-for and x-real-ip both absent', {
        variationId,
        userAgent: request.headers.get('user-agent'),
      })
    }

    const { data, error } = await supabase.rpc('sign_variation', {
      p_variation_id: variationId,
      p_client_name: clientName.trim(),
      p_signature_data: signatureData,
      p_client_ip: clientIp,
      p_declaration_text: declarationText.trim().slice(0, 2000),
      p_user_agent: request.headers.get('user-agent')?.slice(0, 500) ?? null,
    })

    if (error) {
      console.error('RPC error:', error)
      const err = Errors.databaseError()
      return errorResponse(err)
    }

    if (data?.error) {
      if (data.code === 'already_signed') {
        const err = Errors.conflict('Variation has already been signed')
        return errorResponse(err)
      }
      if (data.code === 'content_mismatch') {
        const err = Errors.conflict(data.error)
        return errorResponse(err)
      }
      if (data.code === 'not_found') {
        const err = Errors.notFound('Variation')
        return errorResponse(err)
      }
      const err = Errors.invalidInput(data.error)
      return errorResponse(err)
    }

    // ── Notifications ─────────────────────────────────────────────────────────
    // The signature is already committed at this point. Everything below is
    // best-effort: the client's browser must get a success response even if every
    // email provider is down. Each step is wrapped separately so one failure
    // cannot skip the others.
    const signedAt = new Date().toISOString()
    let emailWarning: string | undefined

    type SignedJob = {
      job_name: string
      address: string
      client_email: string
      client_name: string
      contractor: { email: string } | null
    }

    let variationDetails: { description: string; cost: number; job_id: string } | null = null
    let job: SignedJob | null = null

    // Fetched once and shared by both emails. Wrapped in its own try: the signature
    // has already committed, so a failure loading these details must degrade to a
    // warning, never a 500 that tells the client their signature didn't take.
    try {
      const { data: details } = await supabase
        .from('variations')
        .select('description, cost, date, job_id, job:jobs(job_name, address, client_email, client_name, contractor:contractors(email))')
        .eq('id', variationId)
        .single()

      variationDetails = details
      job = (details?.job ?? null) as unknown as SignedJob | null
    } catch (fetchError) {
      console.error('[sign] failed to load variation details for notifications:', fetchError)
      emailWarning = 'Confirmation email could not be sent. The contractor has been notified.'
    }

    // 1. Confirmation to the client who just signed.
    try {
      if (variationDetails && job?.client_email) {
        await sendSignatureConfirmation({
          clientEmail: job.client_email,
          clientName: clientName.trim(),
          jobName: job.job_name,
          address: job.address,
          description: variationDetails.description,
          cost: variationDetails.cost,
          signedAt,
        })
      } else if (!emailWarning) {
        // Guarded so a failed details fetch keeps its own, accurate message rather
        // than being relabelled as "no client email on file".
        emailWarning = 'No client email on file — confirmation not sent.'
      }
    } catch (emailError) {
      console.error('Signature confirmation email failed:', emailError)
      emailWarning = 'Confirmation email could not be sent. The contractor has been notified.'
    }

    // 2. Notification to the contractor that their variation was signed. This is
    // what makes the warning above's "the contractor has been notified" true.
    // signed_notice_sent_at is only stamped on a confirmed send — if this fails,
    // the row stays null and the daily cron picks it up (see 020 migration).
    try {
      const contractorEmail = job?.contractor?.email

      if (variationDetails && job && contractorEmail) {
        const sent = await sendVariationSignedNotice({
          contractorEmail,
          jobId: variationDetails.job_id,
          jobName: job.job_name,
          address: job.address,
          description: variationDetails.description,
          cost: variationDetails.cost,
          signerName: clientName.trim(),
          signedAt,
        })

        if (sent) {
          await supabase
            .from('variations')
            .update({ signed_notice_sent_at: signedAt })
            .eq('id', variationId)
        }
      } else {
        console.warn('[sign] no contractor email on file — signed notice deferred to cron', { variationId })
      }
    } catch (notifyError) {
      console.error('Contractor signed-notice failed:', notifyError)
    }

    return NextResponse.json({ success: true, ...(emailWarning ? { emailWarning } : {}) })
  } catch (error) {
    console.error('Signature submission error:', error)
    return errorResponse(error)
  }
}
