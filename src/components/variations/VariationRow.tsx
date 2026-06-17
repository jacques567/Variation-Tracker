'use client'

import { useState } from 'react'
import { Share2, Check, Image, CheckCircle2 } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Variation, Signature } from '@/types'

interface Props {
  variation: Variation & { signature: Signature | null }
  jobId: string
}

const statusStyles: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  pending: 'bg-amber-50 text-amber-700',
  signed: 'bg-green-50 text-green-700',
}

export default function VariationRow({ variation, jobId }: Props) {
  const [copied, setCopied] = useState(false)

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL && process.env.NEXT_PUBLIC_APP_URL !== 'undefined')
    ? process.env.NEXT_PUBLIC_APP_URL
    : (typeof window !== 'undefined' ? window.location.origin : '')
  const signLink = `${appUrl}/sign/${variation.signature_token}`

  async function copyLink() {
    try {
      if (!variation.signature_token) {
        console.warn('No signature token available')
        return
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(signLink)
      } else {
        const input = document.createElement('input')
        input.value = signLink
        document.body.appendChild(input)
        input.select()
        document.execCommand('copy')
        document.body.removeChild(input)
      }

      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy link:', err)
    }
  }

  async function shareLink() {
    try {
      if (!variation.signature_token) {
        console.warn('No signature token available')
        return
      }

      if (navigator.share) {
        await navigator.share({
          title: 'Variation Signature',
          text: 'Please sign this variation:',
          url: signLink,
        })
      } else {
        // Fallback to copy for browsers without Share API (mainly Firefox)
        await copyLink()
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Failed to share link:', err)
      }
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium text-gray-900 text-sm">{variation.description}</p>
            {variation.status === 'signed' ? (
              <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium bg-green-50 text-green-700">
                <CheckCircle2 className="w-3 h-3" />
                Signed
              </span>
            ) : (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusStyles[variation.status]}`}>
                Awaiting Signature
              </span>
            )}
            {variation.photo_url && (
              <span className="text-gray-400"><Image className="w-3.5 h-3.5" /></span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-1">{formatDate(variation.date)}</p>
          {variation.signature && (
            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Signed on {formatDate(variation.signature.signed_at)} by {variation.signature.client_name}
            </p>
          )}
        </div>
        <div className="text-right shrink-0">
          <p className="font-semibold text-gray-900">{formatCurrency(variation.cost)}</p>
        </div>
      </div>

      {variation.status === 'draft' && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
          <input
            readOnly
            value={signLink}
            className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-gray-500 truncate"
          />
          <button
            onClick={shareLink}
            aria-label="Share variation link"
            className="flex items-center gap-1 text-xs bg-blue-50 text-blue-600 rounded-lg px-3 py-1.5 hover:bg-blue-100 transition-colors shrink-0"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Share link'}
          </button>
        </div>
      )}
    </div>
  )
}
