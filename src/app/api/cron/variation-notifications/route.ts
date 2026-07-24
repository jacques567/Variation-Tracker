import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendVariationExpiryReminder, sendVariationExpiredNotice } from '@/lib/email'

const REMINDER_WINDOW_DAYS = 2

type VariationRow = {
  id: string
  description: string
  cost: number
  signature_token_expires_at: string
  job: {
    job_name: string
    address: string
    contractor: { email: string } | null
  } | null
}

/**
 * Runs daily (see vercel.json crons). Emails contractors 2 days before an unsigned
 * variation's signing link expires, and again once it has expired, using
 * expiry_reminder_sent_at / expiry_notice_sent_at to avoid double-sending.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const now = new Date()
  const reminderCutoff = new Date(now.getTime() + REMINDER_WINDOW_DAYS * 24 * 60 * 60 * 1000)

  let remindersSent = 0
  let noticesSent = 0

  const { data: dueForReminder, error: reminderError } = await supabase
    .from('variations')
    .select('id, description, cost, signature_token_expires_at, job:jobs(job_name, address, contractor:contractors(email))')
    .eq('status', 'draft')
    .is('expiry_reminder_sent_at', null)
    .gt('signature_token_expires_at', now.toISOString())
    .lte('signature_token_expires_at', reminderCutoff.toISOString())

  if (reminderError) {
    console.error('[cron:variation-notifications] failed to query reminder candidates:', reminderError.message)
  }

  for (const variation of (dueForReminder ?? []) as unknown as VariationRow[]) {
    const contractorEmail = variation.job?.contractor?.email
    if (!contractorEmail || !variation.job) continue

    await sendVariationExpiryReminder({
      contractorEmail,
      jobName: variation.job.job_name,
      address: variation.job.address,
      description: variation.description,
      cost: variation.cost,
      expiresAt: variation.signature_token_expires_at,
    })

    await supabase
      .from('variations')
      .update({ expiry_reminder_sent_at: now.toISOString() })
      .eq('id', variation.id)

    remindersSent++
  }

  const { data: dueForNotice, error: noticeError } = await supabase
    .from('variations')
    .select('id, description, cost, signature_token_expires_at, job:jobs(job_name, address, contractor:contractors(email))')
    .eq('status', 'draft')
    .is('expiry_notice_sent_at', null)
    .lte('signature_token_expires_at', now.toISOString())

  if (noticeError) {
    console.error('[cron:variation-notifications] failed to query expired candidates:', noticeError.message)
  }

  for (const variation of (dueForNotice ?? []) as unknown as VariationRow[]) {
    const contractorEmail = variation.job?.contractor?.email
    if (!contractorEmail || !variation.job) continue

    await sendVariationExpiredNotice({
      contractorEmail,
      jobName: variation.job.job_name,
      address: variation.job.address,
      description: variation.description,
      cost: variation.cost,
      expiresAt: variation.signature_token_expires_at,
    })

    await supabase
      .from('variations')
      .update({ expiry_notice_sent_at: now.toISOString() })
      .eq('id', variation.id)

    noticesSent++
  }

  return NextResponse.json({ remindersSent, noticesSent })
}
