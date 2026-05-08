import { Resend } from 'resend'

const FROM_ADDRESS = 'noreply@vartracker.com'

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
  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: clientEmail,
    subject: `Variation authorised — ${jobName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: sans-serif; color: #111; max-width: 560px; margin: 0 auto; padding: 32px 16px;">
          <p style="font-size: 14px; color: #555; margin-bottom: 4px;">Variation confirmation</p>
          <h1 style="font-size: 20px; margin: 0 0 24px;">${jobName}</h1>

          <p style="font-size: 15px;">Hi ${clientName},</p>
          <p style="font-size: 15px;">This is a confirmation that you have authorised the following variation:</p>

          <div style="background: #f9f9f9; border: 1px solid #e5e5e5; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <p style="margin: 0 0 8px; font-size: 13px; color: #666;">Description of work</p>
            <p style="margin: 0 0 16px; font-size: 15px; font-weight: 500;">${description}</p>

            <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 16px 0;">

            <table style="width: 100%; font-size: 14px;">
              <tr>
                <td style="color: #666;">Site address</td>
                <td style="text-align: right;">${address}</td>
              </tr>
              <tr>
                <td style="color: #666; padding-top: 8px;">Additional cost</td>
                <td style="text-align: right; padding-top: 8px; font-weight: 700; font-size: 18px;">${formatCurrency(cost)}</td>
              </tr>
              <tr>
                <td style="color: #666; padding-top: 8px;">Signed at</td>
                <td style="text-align: right; padding-top: 8px;">${formatDate(signedAt)}</td>
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
