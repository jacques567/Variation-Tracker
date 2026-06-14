import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SignatureForm from '@/components/signature/SignatureForm'
import SignaturePrivacyNotice from '@/components/legal/SignaturePrivacyNotice'
import { formatCurrency, formatDate } from '@/lib/utils'

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-md w-full text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-gray-900 mb-2">Already signed</h1>
          <p className="text-sm text-gray-500">
            This variation was signed by {variation.signer_name} on{' '}
            {variation.signed_at ? formatDate(variation.signed_at) : 'an unknown date'}
          </p>
        </div>
      </div>
    )
  }

  if (isTokenExpired) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-md w-full text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-gray-900 mb-2">Link expired</h1>
          <p className="text-sm text-gray-500">
            This signing link expired on{' '}
            {expiresAt ? formatDate(expiresAt.toISOString()) : 'an unknown date'}. Please contact
            your contractor for a new link.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto pt-8">
        <div className="text-center mb-6">
          <p className="text-sm text-gray-500">Variation notice for</p>
          <h1 className="text-lg font-semibold text-gray-900">{variation.job_name}</h1>
          <p className="text-sm text-gray-400">{variation.address}</p>
        </div>

        {/* Variation details */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
          <p className="text-xs text-gray-500 mb-1">Description of work</p>
          <p className="text-sm text-gray-900 font-medium">{variation.description}</p>

          <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
            <div>
              <p className="text-xs text-gray-500">Date</p>
              <p className="text-sm text-gray-900">{formatDate(variation.date)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Additional cost</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(variation.cost)}</p>
            </div>
          </div>

          {variation.photo_url && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-2">Photo evidence</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={variation.photo_url}
                alt="Variation photo"
                className="w-full rounded-lg object-contain bg-gray-50 max-h-48 cursor-pointer"
                onClick={() => window.open(variation.photo_url, '_blank')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') window.open(variation.photo_url, '_blank')
                }}
              />
            </div>
          )}
        </div>

        <SignatureForm variationId={variation.id} token={token} cost={variation.cost} />
        <SignaturePrivacyNotice />
      </div>
    </div>
  )
}
