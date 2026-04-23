'use client'

import { useRef, useState } from 'react'
import SignatureCanvas from 'react-signature-canvas'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function SignatureForm({
  variationId,
  token,
}: {
  variationId: string
  token: string
}) {
  const router = useRouter()
  const sigRef = useRef<SignatureCanvas>(null)
  const [clientName, setClientName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [isEmpty, setIsEmpty] = useState(true)

  function clearSignature() {
    sigRef.current?.clear()
    setIsEmpty(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!clientName.trim()) { setError('Please enter your name'); return }
    if (sigRef.current?.isEmpty()) { setError('Please sign before submitting'); return }
    setError(null)
    setLoading(true)

    const signatureData = sigRef.current!.toDataURL('image/png')

    const supabase = createClient()

    // Insert signature
    const { error: sigError } = await supabase.from('signatures').insert({
      variation_id: variationId,
      client_name: clientName.trim(),
      signature_data: signatureData,
    })

    if (sigError) {
      setError('Failed to save signature. Please try again.')
      setLoading(false)
      return
    }

    // Update variation status to signed
    await supabase
      .from('variations')
      .update({ status: 'signed' })
      .eq('id', variationId)

    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Your full name</label>
        <input
          type="text"
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="John Smith"
          required
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium text-gray-700">Signature</label>
          <button type="button" onClick={clearSignature} className="text-xs text-gray-400 hover:text-gray-600">
            Clear
          </button>
        </div>
        <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 overflow-hidden">
          <SignatureCanvas
            ref={sigRef}
            canvasProps={{
              className: 'w-full',
              height: 160,
            }}
            backgroundColor="transparent"
            onBegin={() => setIsEmpty(false)}
          />
        </div>
        <p className="text-xs text-gray-400 mt-1">Draw your signature above</p>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white rounded-lg px-4 py-3 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {loading ? 'Submitting...' : 'Sign and agree'}
      </button>

      <p className="text-xs text-gray-400 text-center">
        This constitutes a legally binding agreement under the Electronic Communications Act 2000
      </p>
    </form>
  )
}
