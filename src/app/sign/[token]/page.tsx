import { notFound } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import SignatureForm from '@/components/signature/SignatureForm'
import SignaturePrivacyNotice from '@/components/legal/SignaturePrivacyNotice'
import { formatCurrency, formatDate } from '@/lib/utils'

function SignLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-vt-light overflow-hidden">
      <Image
        src="/images/bg-auth.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover opacity-50"
      />
      <div className="relative z-10 flex flex-col min-h-screen">
        <header className="bg-white border-b border-vt-border">
          <div className="h-16 flex items-center justify-center gap-2">
            <Image src="/VarTrackerLogo3Trans.png" alt="" width={50} height={50} className="h-[50px] w-[50px] object-contain" />
            <span className="text-base font-bold text-vt-dark tracking-tight">VarTracker</span>
          </div>
        </header>
        <main className="flex-1 flex justify-center px-4 pt-10 pb-8">
          <div className="w-full max-w-[460px]">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default async function SignPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  // Validate token is a UUID before hitting the DB
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if (!uuidPattern.test(token)) notFound()

  const supabase = await createClient()

  // Use SECURITY DEFINER RPC — returns only the fields the sign page needs.
  // No contractor_id, no job_id, no client_email exposed to the public client.
  const { data: rows, error: rpcError } = await supabase.rpc('get_variation_by_token', { p_token: token })
  if (rpcError) console.error('[sign page] get_variation_by_token error:', rpcError.message)
  const variation = rows?.[0] ?? null

  if (!variation) notFound()

  const expiresAt = variation.signature_token_expires_at
    ? new Date(variation.signature_token_expires_at)
    : null
  const isTokenExpired = !expiresAt || expiresAt < new Date()

  if (variation.status === 'signed') {
    return (
      <SignLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="bg-white rounded-xl border border-vt-border p-8 max-w-md w-full text-center shadow-[0_1px_2px_rgba(15,23,32,0.04)]">
            <div className="w-12 h-12 bg-[#ECFDF5] rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-vt-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-lg font-semibold text-vt-dark mb-2">Already signed</h1>
            <p className="text-sm text-vt-muted">
              This variation was signed by {variation.signer_name} on{' '}
              {variation.signed_at ? formatDate(variation.signed_at) : 'an unknown date'}
            </p>
          </div>
        </div>
      </SignLayout>
    )
  }

  if (isTokenExpired) {
    return (
      <SignLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="bg-white rounded-xl border border-vt-border p-8 max-w-md w-full text-center shadow-[0_1px_2px_rgba(15,23,32,0.04)]">
            <div className="w-12 h-12 bg-vt-error-bg rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-vt-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-lg font-semibold text-vt-dark mb-2">Link expired</h1>
            <p className="text-sm text-vt-muted">
              This signing link expired on{' '}
              {expiresAt ? formatDate(expiresAt.toISOString()) : 'an unknown date'}. Please contact
              your contractor for a new link.
            </p>
          </div>
        </div>
      </SignLayout>
    )
  }

  return (
    <SignLayout>
      <div className="text-center mb-5">
        <p className="text-sm text-vt-muted">Variation notice for</p>
        <h1 className="text-2xl font-semibold text-vt-dark mt-0.5">{variation.job_name}</h1>
        <p className="text-sm text-vt-muted mt-0.5">{variation.address}</p>
      </div>

      {/* Variation details */}
      <div className="bg-white border border-vt-border rounded-xl p-5 mb-4 shadow-[0_1px_2px_rgba(15,23,32,0.04)]">
        <p className="text-xs text-vt-muted mb-1">Description of work</p>
        <p className="text-sm font-semibold text-vt-dark">{variation.description}</p>

        <div className="flex justify-between items-center mt-4 pt-4 border-t border-[#EEF1F5]">
          <div>
            <p className="text-xs text-vt-muted">Date</p>
            <p className="text-sm text-vt-dark mt-0.5">{formatDate(variation.date)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-vt-muted">Additional cost</p>
            <p className="text-2xl font-bold text-vt-dark mt-0.5">{formatCurrency(variation.cost)}</p>
          </div>
        </div>

        {variation.photo_url && (
          <div className="mt-4 pt-4 border-t border-[#EEF1F5]">
            <p className="text-xs text-vt-muted mb-2">Photo evidence</p>
            <a href={variation.photo_url} target="_blank" rel="noopener noreferrer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={variation.photo_url}
                alt="Variation photo"
                className="w-full rounded-[10px] object-contain bg-[#F7F9FB] max-h-48 cursor-pointer"
              />
            </a>
          </div>
        )}
      </div>

      <SignatureForm variationId={variation.id} token={token} cost={variation.cost} />
      <SignaturePrivacyNotice />
    </SignLayout>
  )
}
