'use client'

import { useState } from 'react'
import { formatCurrency } from '@/lib/utils'

/**
 * "£X awaiting client sign-off" notice. Stays mounted so it can fade and
 * collapse when the last pending variation is signed, instead of vanishing.
 */
export default function PendingBanner({ pendingTotal }: { pendingTotal: number }) {
  // Keep the last non-zero amount so the text doesn't flash "£0.00" while the
  // banner is animating out.
  const [lastAmount, setLastAmount] = useState(pendingTotal)
  if (pendingTotal > 0 && pendingTotal !== lastAmount) setLastAmount(pendingTotal)

  const open = pendingTotal > 0

  return (
    <div
      aria-hidden={!open}
      className={`grid transition-[grid-template-rows,opacity,visibility] duration-300 ease-out motion-reduce:transition-none ${
        open ? 'grid-rows-[1fr] opacity-100 visible' : 'grid-rows-[0fr] opacity-0 invisible'
      }`}
    >
      <div className="overflow-hidden">
        <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-[10px] px-4 py-[11px] mb-6 text-[13px] text-[#92400E]">
          {formatCurrency(lastAmount)} in variations awaiting client sign-off
        </div>
      </div>
    </div>
  )
}
