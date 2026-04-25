'use client'

import { useState, useEffect } from 'react'
import { formatDate, formatCurrency } from '@/lib/utils'

interface Signature {
  id: string
  variation_id: string
  client_name: string
  signature_data: string
  created_at: string
  signed_at?: string
  admin_notes?: string
}

interface Variation {
  id: string
  description: string
  cost: number
  date: string
}

export default function SignatureModal({
  signature,
  variation,
}: {
  signature: Signature
  variation?: Variation
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [notes, setNotes] = useState(signature.admin_notes || '')
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
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

  async function saveNotes() {
    if (notes === signature.admin_notes) return
    if (!csrfToken) {
      setSaveSuccess(false)
      return
    }

    setIsSaving(true)

    try {
      const res = await fetch(`/api/signatures/${signature.id}/notes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes, csrfToken }),
      })

      setIsSaving(false)
      if (res.ok) {
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 2000)
      }
    } catch (err) {
      setIsSaving(false)
      console.error('Failed to save notes:', err)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
      >
        View signature
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Signature Preview</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Client Info */}
              <div>
                <p className="text-sm text-gray-500 mb-1">Signed by</p>
                <p className="text-lg font-medium text-gray-900">{signature.client_name}</p>
              </div>

              {/* Date */}
              <div>
                <p className="text-sm text-gray-500 mb-1">Signed on</p>
                <p className="text-gray-900">{formatDate(signature.signed_at || signature.created_at)}</p>
              </div>

              {/* Variation Details */}
              {variation && (
                <>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Description</p>
                    <p className="text-gray-900">{variation.description}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Cost</p>
                    <p className="text-gray-900">{formatCurrency(variation.cost)}</p>
                  </div>
                </>
              )}

              {/* Signature Image */}
              <div>
                <p className="text-sm text-gray-500 mb-3">Signature</p>
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <img
                    src={signature.signature_data}
                    alt="Signature"
                    className="w-full max-h-48 object-contain"
                  />
                </div>
              </div>

              {/* Admin Notes */}
              <div>
                <p className="text-sm text-gray-500 mb-2">Admin notes</p>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes about this signature (e.g., needs revision, approved for processing)"
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={saveNotes}
                  disabled={isSaving || notes === signature.admin_notes}
                  className="flex-1 bg-blue-600 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {isSaving ? 'Saving...' : saveSuccess ? '✓ Saved' : 'Save notes'}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="flex-1 bg-gray-100 text-gray-900 rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
