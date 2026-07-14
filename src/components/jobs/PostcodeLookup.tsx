'use client'

import { useState } from 'react'
import IdealAddressLookup from './IdealAddressLookup'

const USE_IDEAL_POSTCODES = process.env.NEXT_PUBLIC_USE_IDEAL_POSTCODES === 'true'

interface PostcodeResult {
  adminDistrict: string
  county: string
  postcode: string
}

interface Props {
  onAddressChange: (address: string) => void
  initialValue?: string
}

type Mode = 'lookup' | 'found' | 'manual'

export default function PostcodeLookup({ onAddressChange, initialValue = '' }: Props) {
  const [mode, setMode] = useState<Mode>(initialValue ? 'manual' : 'lookup')
  const [postcode, setPostcode] = useState('')
  const [street, setStreet] = useState('')
  const [postcodeResult, setPostcodeResult] = useState<PostcodeResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [manualValue, setManualValue] = useState(initialValue)

  async function handleFind() {
    const normalised = postcode.replace(/\s+/g, '').toUpperCase()
    if (!normalised) {
      setError('Please enter a postcode')
      return
    }

    setError(null)
    setLoading(true)

    try {
      const res = await fetch(`https://api.postcodes.io/postcodes/${normalised}`)
      const json = await res.json()

      if (res.status === 404 || json.status === 404) {
        setError('Postcode not found — check and try again')
        setLoading(false)
        return
      }

      if (!res.ok) {
        throw new Error('API error')
      }

      const result: PostcodeResult = {
        adminDistrict: json.result.admin_district ?? '',
        county: json.result.admin_county ?? json.result.region ?? '',
        postcode: json.result.postcode,
      }

      setPostcodeResult(result)
      setMode('found')
      // Initial assembly with empty street
      emitAddress('', result)
    } catch {
      setError('Address lookup unavailable — please enter manually')
      setMode('manual')
    } finally {
      setLoading(false)
    }
  }

  function emitAddress(streetValue: string, result: PostcodeResult) {
    const parts = [streetValue, result.adminDistrict, result.postcode].filter(Boolean)
    onAddressChange(parts.join(', '))
  }

  function handleStreetChange(value: string) {
    setStreet(value)
    if (postcodeResult) emitAddress(value, postcodeResult)
  }

  function handleManualChange(value: string) {
    setManualValue(value)
    onAddressChange(value)
  }

  function switchToManual() {
    setMode('manual')
    setError(null)
    setPostcodeResult(null)
    setStreet('')
    setManualValue('')
    onAddressChange('')
  }

  function switchToLookup() {
    setMode('lookup')
    setError(null)
    setPostcode('')
    setStreet('')
    setPostcodeResult(null)
    setManualValue('')
    onAddressChange('')
  }

  const inputClass = 'w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500'

  if (USE_IDEAL_POSTCODES && mode !== 'manual') {
    return (
      <div>
        <IdealAddressLookup
          onAddressChange={onAddressChange}
          initialValue={initialValue}
          onFallback={switchToManual}
        />
        <button
          type="button"
          onClick={switchToManual}
          className="mt-1.5 text-xs text-blue-600 hover:underline"
        >
          or enter address manually
        </button>
      </div>
    )
  }

  if (mode === 'manual') {
    return (
      <div>
        <input
          type="text"
          required
          value={manualValue}
          onChange={e => handleManualChange(e.target.value)}
          className={inputClass}
          placeholder="14 Maple Street, Manchester, M1 1AB"
        />
        <button
          type="button"
          onClick={switchToLookup}
          className="mt-1.5 text-xs text-blue-600 hover:underline"
        >
          Use postcode lookup instead
        </button>
      </div>
    )
  }

  if (mode === 'found' && postcodeResult) {
    return (
      <div className="space-y-2">
        <input
          type="text"
          required
          value={street}
          onChange={e => handleStreetChange(e.target.value)}
          className={inputClass}
          placeholder="House number and street name"
          autoFocus
        />
        <input
          type="text"
          readOnly
          value={`${postcodeResult.adminDistrict}${postcodeResult.county ? ', ' + postcodeResult.county : ''}, ${postcodeResult.postcode}`}
          className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm bg-gray-50 text-gray-500 cursor-default"
        />
        <button
          type="button"
          onClick={switchToManual}
          className="text-xs text-blue-600 hover:underline"
        >
          Enter address manually instead
        </button>
      </div>
    )
  }

  // lookup mode
  return (
    <div>
      <div className="flex gap-2">
        <input
          type="text"
          value={postcode}
          onChange={e => { setPostcode(e.target.value.toUpperCase()); setError(null) }}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleFind())}
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2.5 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
          placeholder="e.g. M1 1AB"
        />
        <button
          type="button"
          onClick={handleFind}
          disabled={loading}
          className="rounded-lg bg-blue-600 text-white px-4 py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors whitespace-nowrap"
        >
          {loading ? 'Finding…' : 'Find address'}
        </button>
      </div>
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
      <button
        type="button"
        onClick={switchToManual}
        className="mt-1.5 text-xs text-blue-600 hover:underline"
      >
        or enter address manually
      </button>
    </div>
  )
}
