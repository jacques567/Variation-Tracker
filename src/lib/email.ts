import { Resend } from 'resend'

const FROM_ADDRESS = 'noreply@vartracker.com'

/** Escapes HTML special characters to prevent injection in email templates. */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

function getResendClient(): Resend {
  const key = process.env.RESEND_API_KEY
  if (!key) {
    throw new Error('RESEND_API_KEY is not configured')
  }
  return new Resend(key)
}

export interface SignatureConfirmationParams {
  clientEmail: string
  clientName: string
  jobName: string
  address: string
  description: string
  cost: number // in pence
  signedAt: string
}

function formatCurrency(pence: number): string {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(pence / 100)
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export async function sendSignatureConfirmation(params: SignatureConfirmationParams) {
  const { clientEmail, clientName, jobName, address, description, cost, signedAt } = params

  const resend = getResendClient()
  // Escape all dynamic values before HTML interpolation to prevent email injection.
  const safeJobName     = escapeHtml(jobName)
  const safeClientName  = escapeHtml(clientName)
  const safeDescription = escapeHtml(description)
  const safeAddress     = escapeHtml(address)
  const safeCost        = escapeHtml(formatCurrency(cost))
  const safeSignedAt    = escapeHtml(formatDate(signedAt))

  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: clientEmail,
    subject: `Variation authorised — ${jobName}`, // plain text — do not HTML-escape
    html: `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: sans-serif; color: #111; max-width: 560px; margin: 0 auto; padding: 32px 16px;">
          <p style="font-size: 14px; color: #555; margin-bottom: 4px;">Variation confirmation</p>
          <h1 style="font-size: 20px; margin: 0 0 24px;">${safeJobName}</h1>

          <p style="font-size: 15px;">Hi ${safeClientName},</p>
          <p style="font-size: 15px;">This is a confirmation that you have authorised the following variation:</p>

          <div style="background: #f9f9f9; border: 1px solid #e5e5e5; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <p style="margin: 0 0 8px; font-size: 13px; color: #666;">Description of work</p>
            <p style="margin: 0 0 16px; font-size: 15px; font-weight: 500;">${safeDescription}</p>

            <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 16px 0;">

            <table style="width: 100%; font-size: 14px;">
              <tr>
                <td style="color: #666;">Site address</td>
                <td style="text-align: right;">${safeAddress}</td>
              </tr>
              <tr>
                <td style="color: #666; padding-top: 8px;">Additional cost</td>
                <td style="text-align: right; padding-top: 8px; font-weight: 700; font-size: 18px;">${safeCost}</td>
              </tr>
              <tr>
                <td style="color: #666; padding-top: 8px;">Signed at</td>
                <td style="text-align: right; padding-top: 8px;">${safeSignedAt}</td>
              </tr>
            </table>
          </div>

          <p style="font-size: 13px; color: #888;">
            This authorisation was captured electronically and constitutes a legally binding agreement
            under the Electronic Communications Act 2000. Please retain this email for your records.
          </p>
          <p style="font-size: 13px; color: #aaa; margin-top: 32px;">VarTracker · vartracker.com</p>
        </body>
      </html>
    `,
  })

  if (error) {
    // Log but don't throw — signing itself succeeded, email is best-effort
    console.error('Failed to send signature confirmation email:', error)
  }
}

export interface VariationExpiryParams {
  contractorEmail: string
  jobName: string
  address: string
  description: string
  cost: number // in pence
  expiresAt: string
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://vartracker.com'

/** Sent ~2 days before a signing link expires, so the contractor can chase the client. */
export async function sendVariationExpiryReminder(params: VariationExpiryParams) {
  const { contractorEmail, jobName, address, description, cost, expiresAt } = params

  const resend = getResendClient()
  const safeJobName     = escapeHtml(jobName)
  const safeDescription = escapeHtml(description)
  const safeAddress     = escapeHtml(address)
  const safeCost        = escapeHtml(formatCurrency(cost))
  const safeExpiresAt   = escapeHtml(formatDate(expiresAt))

  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: contractorEmail,
    subject: `Reminder: signature needed on "${jobName}" by ${formatDate(expiresAt)}`, // plain text — do not HTML-escape
    html: `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: sans-serif; color: #111; max-width: 560px; margin: 0 auto; padding: 32px 16px;">
          <p style="font-size: 14px; color: #555; margin-bottom: 4px;">Still awaiting signature</p>
          <h1 style="font-size: 20px; margin: 0 0 24px;">${safeJobName}</h1>

          <p style="font-size: 15px;">
            Your client hasn't signed off on this variation yet, and their signing link expires on
            <strong>${safeExpiresAt}</strong>. A quick nudge now can save you re-issuing the request later.
          </p>

          <div style="background: #f9f9f9; border: 1px solid #e5e5e5; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <p style="margin: 0 0 8px; font-size: 13px; color: #666;">Description of work</p>
            <p style="margin: 0 0 16px; font-size: 15px; font-weight: 500;">${safeDescription}</p>

            <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 16px 0;">

            <table style="width: 100%; font-size: 14px;">
              <tr>
                <td style="color: #666;">Site address</td>
                <td style="text-align: right;">${safeAddress}</td>
              </tr>
              <tr>
                <td style="color: #666; padding-top: 8px;">Additional cost</td>
                <td style="text-align: right; padding-top: 8px; font-weight: 700; font-size: 18px;">${safeCost}</td>
              </tr>
            </table>
          </div>

          <p style="font-size: 13px;"><a href="${APP_URL}/jobs" style="color: #2563eb;">View this job in VarTracker →</a></p>
          <p style="font-size: 13px; color: #aaa; margin-top: 32px;">VarTracker · vartracker.com</p>
        </body>
      </html>
    `,
  })

  if (error) {
    console.error('Failed to send variation expiry reminder email:', error)
  }
}

/** Sent once a signing link has expired unsigned, so the contractor knows to re-issue it. */
export async function sendVariationExpiredNotice(params: VariationExpiryParams) {
  const { contractorEmail, jobName, address, description, cost, expiresAt } = params

  const resend = getResendClient()
  const safeJobName     = escapeHtml(jobName)
  const safeDescription = escapeHtml(description)
  const safeAddress     = escapeHtml(address)
  const safeCost        = escapeHtml(formatCurrency(cost))
  const safeExpiresAt   = escapeHtml(formatDate(expiresAt))

  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: contractorEmail,
    subject: `Signing link expired — "${jobName}" needs to be re-issued`, // plain text — do not HTML-escape
    html: `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: sans-serif; color: #111; max-width: 560px; margin: 0 auto; padding: 32px 16px;">
          <p style="font-size: 14px; color: #555; margin-bottom: 4px;">Signing link expired</p>
          <h1 style="font-size: 20px; margin: 0 0 24px;">${safeJobName}</h1>

          <p style="font-size: 15px;">
            The signing link for this variation expired on <strong>${safeExpiresAt}</strong> without being signed.
            No action was taken and nothing was lost — re-issue the variation from your dashboard to send
            your client a fresh link.
          </p>

          <div style="background: #f9f9f9; border: 1px solid #e5e5e5; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <p style="margin: 0 0 8px; font-size: 13px; color: #666;">Description of work</p>
            <p style="margin: 0 0 16px; font-size: 15px; font-weight: 500;">${safeDescription}</p>

            <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 16px 0;">

            <table style="width: 100%; font-size: 14px;">
              <tr>
                <td style="color: #666;">Site address</td>
                <td style="text-align: right;">${safeAddress}</td>
              </tr>
              <tr>
                <td style="color: #666; padding-top: 8px;">Additional cost</td>
                <td style="text-align: right; padding-top: 8px; font-weight: 700; font-size: 18px;">${safeCost}</td>
              </tr>
            </table>
          </div>

          <p style="font-size: 13px;"><a href="${APP_URL}/jobs" style="color: #2563eb;">Re-issue this variation →</a></p>
          <p style="font-size: 13px; color: #aaa; margin-top: 32px;">VarTracker · vartracker.com</p>
        </body>
      </html>
    `,
  })

  if (error) {
    console.error('Failed to send variation expired notice email:', error)
  }
}
