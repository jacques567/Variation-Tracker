'use client'

import { useEffect, useRef } from 'react'

/**
 * Shown in place of the signing form the moment a signature is accepted.
 * The tick draws itself (see .vt-tick-* in globals.css); with reduced motion
 * it simply appears.
 */
export default function SignedConfirmation({
  name,
  children,
}: {
  name: string
  children?: React.ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)

  // The form above this is taller than the confirmation, so on a phone the
  // card can land off-screen once the form unmounts.
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ref.current?.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' })
  }, [])

  return (
    <div
      ref={ref}
      role="status"
      className="bg-white rounded-xl border border-vt-border p-8 text-center shadow-[0_1px_2px_rgba(15,23,32,0.04)]"
    >
      <svg
        viewBox="0 0 52 52"
        fill="none"
        aria-hidden="true"
        className="vt-pop w-20 h-20 mx-auto mb-4 text-vt-success"
      >
        <circle
          className="vt-tick-circle"
          cx="26"
          cy="26"
          r="24"
          pathLength={1}
          stroke="currentColor"
          strokeWidth="3"
        />
        <path
          className="vt-tick-check"
          d="M15 27l8 8 15-16"
          pathLength={1}
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <h2 className="vt-rise-late text-xl font-semibold text-vt-dark">Signed</h2>
      <p className="vt-rise-late text-sm text-vt-muted mt-1">
        Thanks, {name}. Your signature has been recorded.
      </p>
      {children && <div className="mt-4 text-left">{children}</div>}
    </div>
  )
}
