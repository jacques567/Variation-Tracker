'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Link2, Share2, Check, ChevronUp, CheckCircle2, X } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import SignatureRecord from './SignatureRecord'
import type { Variation, Signature } from '@/types'

interface Props {
  variation: Variation & { signature: Signature | null }
  jobId: string
  jobName: string
  clientName: string
  companyName: string | null
  address: string
}

type DeliveryChannel = 'email' | 'whatsapp' | 'sms' | 'share_sheet' | 'link_copied' | 'in_person' | 'other'

const statusStyles: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  pending: 'bg-amber-50 text-amber-700',
  signed: 'bg-green-50 text-green-700',
}

export default function VariationRow({ variation, jobId, jobName, clientName, companyName, address }: Props) {
  const [copied, setCopied] = useState<'link' | null>(null)
  const [shared, setShared] = useState(false)
  const [canNativeShare, setCanNativeShare] = useState(false)
  const [photoOpen, setPhotoOpen] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [cancelError, setCancelError] = useState<string | null>(null)
  const router = useRouter()

  // Firefox (desktop and Android) and older browsers don't implement the Web
  // Share API — they fall back to the copy-link button below.
  useEffect(() => {
    setCanNativeShare(typeof navigator !== 'undefined' && typeof navigator.share === 'function')
  }, [])

  // Best-effort: a failed delivery log must never block the contractor from
  // actually sending the variation. The record is corroborating evidence, not
  // a precondition of sharing.
  async function recordDelivery(channel: DeliveryChannel, to?: string) {
    try {
      let csrfToken = sessionStorage.getItem('csrfToken')
      if (!csrfToken) {
        const res = await fetch('/api/csrf-token')
        csrfToken = (await res.json()).csrfToken
        if (csrfToken) sessionStorage.setItem('csrfToken', csrfToken)
      }
      if (!csrfToken) return false

      const res = await fetch(`/api/variations/${variation.id}/deliveries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel, recipient: to ?? null, csrfToken }),
      })
      return res.ok
    } catch (err) {
      console.error('Failed to record delivery:', err)
      return false
    }
  }

  // RLS only allows deleting a variation while status <> 'signed', so this
  // can never remove evidence of something the client already agreed to.
  async function cancelVariation() {
    if (!window.confirm('Cancel this variation? This cannot be undone.')) return

    setCancelling(true)
    setCancelError(null)
    const supabase = createClient()
    const { error } = await supabase.from('variations').delete().eq('id', variation.id)

    if (error) {
      setCancelError(error.message)
      setCancelling(false)
      return
    }

    router.refresh()
  }

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL && process.env.NEXT_PUBLIC_APP_URL !== 'undefined')
    ? process.env.NEXT_PUBLIC_APP_URL
    : (typeof window !== 'undefined' ? window.location.origin : '')
  const signLink = `${appUrl}/sign/${variation.signature_token}`

  const fromSuffix = companyName ? ` from ${companyName}` : ''
  const shareText = `Hi ${clientName}, please review and sign this ${formatCurrency(variation.cost)} variation for ${jobName}${fromSuffix} at ${address}:`

  async function copyToClipboard(value: string) {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value)
    } else {
      const input = document.createElement('input')
      input.value = value
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
    }
  }

  async function copyLink() {
    try {
      if (!variation.signature_token) {
        console.warn('No signature token available')
        return
      }

      await copyToClipboard(signLink)
      setCopied('link')
      setTimeout(() => setCopied(null), 2000)
      void recordDelivery('link_copied')
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

      // url is passed separately from text so share targets that support it
      // (WhatsApp, iMessage, Mail) drop in a real link rather than folding it
      // into the message body as plain text.
      await navigator.share({ title: 'Variation for signature', text: shareText, url: signLink })
      // The Web Share API resolves once the OS share sheet reports success,
      // but never tells the page which app the contractor picked — that's a
      // deliberate browser privacy limit, not something we can work around.
      setShared(true)
      setTimeout(() => setShared(false), 2000)
      void recordDelivery('share_sheet')
    } catch (err) {
      // AbortError just means the contractor closed the share sheet without
      // picking anything — not a failure worth logging or surfacing.
      if (err instanceof Error && err.name === 'AbortError') return
      console.error('Failed to open share sheet:', err)
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
          </div>
          <p className="text-xs text-gray-400 mt-1">{formatDate(variation.date)}</p>
        </div>
        <div className="flex items-start gap-2 shrink-0">
          {variation.photo_url && (
            <button
              onClick={() => setPhotoOpen(o => !o)}
              aria-label="View photo"
              aria-expanded={photoOpen}
              className="rounded-lg overflow-hidden border border-gray-200 hover:border-blue-300 transition-colors"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={variation.photo_url}
                alt="Variation photo thumbnail"
                className="w-12 h-12 object-cover"
              />
            </button>
          )}
          <p className="font-semibold text-gray-900">{formatCurrency(variation.cost)}</p>
          {variation.status !== 'signed' && (
            <button
              onClick={cancelVariation}
              disabled={cancelling}
              aria-label="Cancel variation"
              title="Cancel variation"
              className="text-gray-300 hover:text-red-500 transition-colors disabled:opacity-50"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {cancelError && (
        <p className="text-xs text-red-600 mt-2">Couldn&apos;t cancel: {cancelError}</p>
      )}

      {variation.photo_url && photoOpen && (
        <div className="mt-3 relative">
          <button
            onClick={() => setPhotoOpen(false)}
            className="absolute top-2 right-2 bg-white rounded-full p-0.5 shadow-sm hover:bg-gray-50 transition-colors"
            aria-label="Close photo"
          >
            <ChevronUp className="w-4 h-4 text-gray-500" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={variation.photo_url}
            alt="Variation photo"
            className="w-full rounded-lg object-contain bg-gray-50 max-h-64"
          />
        </div>
      )}

      {variation.signature && (
        <SignatureRecord signature={variation.signature} variationId={variation.id} />
      )}

      {variation.status === 'draft' && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
          <input
            readOnly
            value={signLink}
            className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-gray-500 truncate"
          />
          {canNativeShare ? (
            <button
              onClick={shareLink}
              aria-label="Share sign link"
              className="flex items-center gap-1 text-xs bg-blue-50 text-blue-600 rounded-lg px-3 py-1.5 hover:bg-blue-100 transition-colors shrink-0"
            >
              {shared ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
              {shared ? 'Shared' : 'Share'}
            </button>
          ) : (
            <button
              onClick={copyLink}
              aria-label="Copy sign link"
              className="flex items-center gap-1 text-xs bg-blue-50 text-blue-600 rounded-lg px-3 py-1.5 hover:bg-blue-100 transition-colors shrink-0"
            >
              {copied === 'link' ? <Check className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
              {copied === 'link' ? 'Copied' : 'Copy link'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
