'use client'

import { useRef, useState, useEffect } from 'react'
import SignatureCanvas from 'react-signature-canvas'
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
  const [csrfToken, setCsrfToken] = useState<string | null>(null)

  useEffect(() => {
    async function fetchCsrfToken() {
      try {
        const res = await fetch('/api/csrf-token')
        const data = await res.json()
        setCsrfToken(data.csrfToken)
      } catch (err) {
        console.error('Failed to fetch CSRF token:', err)
      }
    }
    fetchCsrfToken()
  }, [])

  function clearSignature() {
    sigRef.current?.clear()
    setIsEmpty(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!clientName.trim()) { setError('Please enter your name'); return }
    if (sigRef.current?.isEmpty()) { setError('Please sign before submitting'); return }
    if (!csrfToken) { setError('Security token missing. Please refresh and try again.'); return }
    setError(null)
    setLoading(true)

    const signatureData = sigRef.current!.toDataURL('image/png')

    try {
      const res = await fetch('/api/signatures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variationId,
          clientName: clientName.trim(),
          signatureData,
          csrfToken,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to save signature. Please try again.')
        setLoading(false)
        return
      }

      router.refresh()
    } catch (err) {
      setError('Failed to save signature. Please try again.')
      setLoading(false)
    }
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
