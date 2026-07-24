'use client'

import { useState } from 'react'
import { CheckCircle2, ChevronDown, ChevronUp, Download } from 'lucide-react'
import { formatDate, formatDateTime, formatReference } from '@/lib/utils'
import type { Signature } from '@/types'

interface Props {
  signature: Signature
  variationId: string
}

/**
 * Audit record for a signed variation. Both parties need to be able to see
 * who signed, exactly when, and what mark they made — so the detail shown
 * here is deliberately the same set of facts that goes onto the invoice PDF.
 */
export default function SignatureRecord({ signature, variationId }: Props) {
  const [open, setOpen] = useState(false)
  const reference = formatReference(variationId)

  return (
    <div className="mt-3 pt-3 border-t border-gray-100">
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="flex items-center gap-1.5 w-full text-left text-xs text-green-700 hover:text-green-800 transition-colors"
      >
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
        <span className="flex-1 min-w-0 truncate">
          Signed by {signature.client_name} on {formatDate(signature.signed_at)}
        </span>
        <span className="flex items-center gap-0.5 shrink-0 text-gray-500">
          {open ? 'Hide' : 'View'} record
          {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </span>
      </button>

      {open && (
        <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-3">
          <div>
            <p className="text-xs text-gray-500 mb-1.5">Signature</p>
            <div className="bg-white border border-gray-200 rounded-lg p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={signature.signature_data}
                alt={`Signature of ${signature.client_name}`}
                className="w-full max-h-28 object-contain"
              />
            </div>
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <dt className="text-gray-500">Signed by</dt>
              <dd className="text-gray-900 font-medium mt-0.5 break-words">{signature.client_name}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Signed at</dt>
              <dd className="text-gray-900 font-medium mt-0.5 tabular-nums">
                {formatDateTime(signature.signed_at)}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Reference</dt>
              <dd className="text-gray-900 font-medium mt-0.5 tabular-nums">{reference}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Signed from IP</dt>
              <dd className="text-gray-900 font-medium mt-0.5 tabular-nums break-all">
                {signature.client_ip || 'Not recorded'}
              </dd>
            </div>
          </dl>

          <a
            href={`/api/pdf/variation/${variationId}`}
            className="flex items-center justify-center gap-1.5 w-full text-xs border border-gray-300 bg-white text-gray-700 rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Download signed record (PDF)
          </a>

          <p className="text-[11px] leading-relaxed text-gray-500">
            Electronic signature captured by VarTracker and valid under the Electronic
            Communications Act 2000. This record is reproduced in full on the exported invoice
            so both parties hold the same evidence.
          </p>
        </div>
      )}
    </div>
  )
}
