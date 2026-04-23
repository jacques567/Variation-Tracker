import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SignatureForm from '@/components/signature/SignatureForm'
import { formatCurrency, formatDate } from '@/lib/utils'

export default async function SignPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = await createClient()

  const { data: variation } = await supabase
    .from('variations')
    .select('*, job:jobs(job_name, client_name, address, contractor_id), signature:signatures(*)')
    .eq('signature_token', token)
    .single()

  if (!variation) notFound()

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
            This variation was signed by {variation.signature?.client_name} on{' '}
            {formatDate(variation.signature?.signed_at ?? '')}
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
          <h1 className="text-lg font-semibold text-gray-900">{variation.job?.job_name}</h1>
          <p className="text-sm text-gray-400">{variation.job?.address}</p>
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
              <img src={variation.photo_url} alt="Variation photo" className="w-full rounded-lg object-cover max-h-48" />
            </div>
          )}
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-4 text-xs text-amber-800">
          By signing below you agree to this variation and the additional cost of{' '}
          <strong>{formatCurrency(variation.cost)}</strong>.
        </div>

        <SignatureForm variationId={variation.id} token={token} />
      </div>
    </div>
  )
}
