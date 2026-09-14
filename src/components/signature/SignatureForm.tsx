'use client'

import { useRef, useState, useEffect } from 'react'
import SignatureCanvas from 'react-signature-canvas'
import { useRouter } from 'next/navigation'

function formatCurrency(pence: number): string {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(pence / 100)
}

function buildDeclaration(name: string, cost: number): string {
  const who = name.trim() ? ` I ${name.trim()}` : ''
  const costPhrase = cost < 0
    ? `the resulting reduction of ${formatCurrency(Math.abs(cost))}`
    : `the additional cost of ${formatCurrency(cost)}`
  return `By signing,${who} confirm I authorise this variation and ${costPhrase}.`
}

export default function SignatureForm({
  variationId,
  token,
  cost,
}: {
  variationId: string
  token: string
  cost: number // in pence
}) {
  const router = useRouter()
  const sigRef = useRef<SignatureCanvas>(null)
  const [clientName, setClientName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [isEmpty, setIsEmpty] = useState(true)
  const [csrfToken, setCsrfToken] = useState<string | null>(null)
  const [emailWarning, setEmailWarning] = useState<string | null>(null)

  // Single source of truth for the consent wording. The exact string shown on
  // screen is the exact string stored against the signature — deriving both
  // from here means the displayed and recorded declarations cannot drift apart.
  const declarationText = buildDeclaration(clientName, cost)

  // The token is single-use server-side — verifyCsrfToken() marks it consumed
  // on *any* /api/sign attempt, even one that goes on to fail a later check
  // (e.g. content_mismatch). Without a refetch, a retry after such a failure
  // reuses the now-dead cached token and fails again with "Invalid security
  // token" instead of the real error — so this is pulled out for reuse.
  async function fetchCsrfToken() {
    try {
      const res = await fetch('/api/csrf-token')
      const data = await res.json()
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('csrfToken', data.csrfToken)
      }
      setCsrfToken(data.csrfToken)
    } catch (err) {
      console.error('Failed to fetch CSRF token:', err)
      setError('Failed to load security token. Please refresh the page.')
    }
  }

  useEffect(() => {
    const cached = typeof window !== 'undefined' ? sessionStorage.getItem('csrfToken') : null
    if (cached) {
      setCsrfToken(cached)
      return
    }
    fetchCsrfToken()
  }, [])

  function clearSignature() {
    sigRef.current?.clear()
    setIsEmpty(true)
  }

  // react-signature-canvas is mounted with clearOnResize={false} so that iOS's
  // collapsing/expanding address bar (a resize event that only changes height)
  // doesn't wipe an in-progress signature. But a real rotation changes the
  // canvas's CSS width too — since the backing pixel buffer is never resized to
  // match, the browser stretches the old buffer into the new box, warping the
  // drawing. Only redraw when width actually changes, and preserve the strokes
  // across it instead of clearing them.
  useEffect(() => {
    let lastWidth = sigRef.current?.getCanvas().offsetWidth ?? 0

    function handleResize() {
      const sigPad = sigRef.current
      if (!sigPad) return
      const canvas = sigPad.getCanvas()
      const newWidth = canvas.offsetWidth
      if (newWidth === lastWidth || sigPad.isEmpty()) {
        lastWidth = newWidth
        return
      }
      lastWidth = newWidth

      const data = sigPad.toData()
      const ratio = Math.max(window.devicePixelRatio || 1, 1)
      canvas.width = canvas.offsetWidth * ratio
      canvas.height = canvas.offsetHeight * ratio
      canvas.getContext('2d')?.scale(ratio, ratio)
      sigPad.fromData(data)
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleResize)
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!clientName.trim()) { setError('Please enter your name'); return }
    if (sigRef.current?.isEmpty()) { setError('Please sign before submitting'); return }
    if (!csrfToken) { setError('Security token missing. Please refresh and try again.'); return }
    setError(null)
    setLoading(true)

    const signatureData = sigRef.current!.toDataURL('image/png')

    try {
      const res = await fetch('/api/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variationId,
          token,
          clientName: clientName.trim(),
          signatureData,
          csrfToken,
          declarationText,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.message || 'Failed to save signature. Please try again.')
        setLoading(false)
        // The token behind this failed attempt is now consumed server-side
        // regardless of why it failed — get a fresh one so an immediate retry
        // doesn't surface an unrelated "Invalid security token" error.
        if (typeof window !== 'undefined') sessionStorage.removeItem('csrfToken')
        setCsrfToken(null)
        fetchCsrfToken()
        return
      }

      if (data.emailWarning) {
        setEmailWarning(data.emailWarning)
      }

      router.refresh()
    } catch (err) {
      console.error('Signature submission error:', err)
      setError('Failed to save signature. Please try again.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-vt-border p-5 flex flex-col gap-3.5 shadow-[0_1px_2px_rgba(15,23,32,0.04)]">
      <div>
        <label className="block text-sm font-semibold text-vt-dark mb-1.5">Your full name</label>
        <input
          type="text"
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          className="w-full h-[42px] rounded-[10px] border border-[#AEB8C7] px-3.5 text-sm bg-white text-vt-dark focus:outline-none focus:border-vt-primary focus:ring-4 focus:ring-vt-primary/15"
          placeholder="John Smith"
          required
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-sm font-semibold text-vt-dark">Signature</label>
          <button type="button" onClick={clearSignature} className="text-xs text-vt-muted hover:text-vt-dark py-3.5 px-2 -my-3.5 -mx-2">
            Clear
          </button>
        </div>
        <div className="rounded-[10px] border-2 border-dashed border-[#AEB8C7] bg-[#F7F9FB] overflow-hidden" style={{ height: 150 }}>
          {/*
            No explicit width/height in canvasProps: react-signature-canvas's
            _resizeCanvas() only devicePixelRatio-scales a dimension when that
            dimension is left undefined. Passing height={150} here previously
            left the canvas's backing-store height unscaled on retina devices
            while the drawing context was still uniformly scaled by the ratio —
            so strokes below roughly the top half/third of the box (depending
            on DPR) were drawn outside the physical backing store and clipped.
            Letting both axes come from CSS (h-full/w-full on the parent's
            fixed 150px box) means both get scaled correctly.
          */}
          <SignatureCanvas
            ref={sigRef}
            canvasProps={{
              className: 'w-full h-full',
            }}
            backgroundColor="transparent"
            clearOnResize={false}
            onBegin={() => setIsEmpty(false)}
            onEnd={() => {
              if (sigRef.current && !sigRef.current.isEmpty()) {
                setIsEmpty(false)
              }
            }}
          />
        </div>
        <p className="text-xs text-vt-muted mt-1.5">Draw your signature above</p>
      </div>

      {error && (
        <p className="text-sm text-vt-error bg-vt-error-bg rounded-[10px] px-3 py-2">{error}</p>
      )}

      {emailWarning && (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-[10px] px-3 py-2">{emailWarning}</p>
      )}

      <div className="rounded-[10px] border border-[#FDE68A] bg-[#FFFBEB] px-3.5 py-3 text-sm font-medium text-[#92400E] leading-relaxed">
        {declarationText}
      </div>

      <button
        type="submit"
        disabled={loading || !csrfToken || isEmpty}
        className="w-full bg-vt-primary text-white rounded-[10px] px-4 py-[13px] text-sm font-semibold hover:bg-vt-primary-hover disabled:opacity-50 transition-colors"
      >
        {loading ? 'Submitting…' : 'Sign and agree'}
      </button>

      <p className="text-xs text-vt-muted text-center leading-relaxed">
        Your electronic signature, name, IP address and the time of signing are recorded, and are
        admissible as evidence under the Electronic Communications Act 2000.
      </p>
    </form>
  )
}
