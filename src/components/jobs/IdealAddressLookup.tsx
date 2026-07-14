'use client'

import { useEffect, useRef, useState } from 'react'

interface Suggestion {
  id: string
  suggestion: string
}

interface Props {
  onAddressChange: (address: string) => void
  initialValue?: string
  onFallback: () => void
}

export default function IdealAddressLookup({ onAddressChange, initialValue = '', onFallback }: Props) {
  const [query, setQuery] = useState(initialValue)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  function handleQueryChange(value: string) {
    setQuery(value)
    setError(null)
    onAddressChange('')

    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (value.trim().length < 3) {
      setSuggestions([])
      setOpen(false)
      return
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/address-lookup/autocomplete?query=${encodeURIComponent(value)}`)
        if (!res.ok) throw new Error('lookup failed')
        const json = await res.json()
        setSuggestions(json.suggestions ?? [])
        setOpen(true)
      } catch {
        setError('Address lookup unavailable — please enter manually')
        onFallback()
      } finally {
        setLoading(false)
      }
    }, 300)
  }

  async function handleSelect(s: Suggestion) {
    setOpen(false)
    setQuery(s.suggestion)
    setLoading(true)
    try {
      const res = await fetch(`/api/address-lookup/resolve/${encodeURIComponent(s.id)}`)
      if (!res.ok) throw new Error('resolve failed')
      const json = await res.json()
      onAddressChange(json.address)
    } catch {
      setError('Could not load that address — please enter manually')
      onFallback()
    } finally {
      setLoading(false)
    }
  }

  const inputClass = 'w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500'

  return (
    <div className="relative">
      <input
        type="text"
        required
        value={query}
        onChange={e => handleQueryChange(e.target.value)}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className={inputClass}
        placeholder="Start typing an address or postcode"
        autoComplete="off"
      />
      {loading && <p className="mt-1.5 text-xs text-gray-500">Searching…</p>}
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
      {open && suggestions.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full max-h-64 overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg text-sm">
          {suggestions.map(s => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => handleSelect(s)}
                className="w-full text-left px-3 py-2 hover:bg-gray-50 text-gray-900"
              >
                {s.suggestion}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
