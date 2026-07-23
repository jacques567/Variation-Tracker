'use client'

import { useState } from 'react'
import { Pencil, Check, X } from 'lucide-react'

export default function ClientEmailEdit({ jobId, initialEmail }: { jobId: string; initialEmail: string }) {
  const [editing, setEditing] = useState(false)
  const [email, setEmail] = useState(initialEmail)
  const [draft, setDraft] = useState(initialEmail)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  function startEdit() {
    setDraft(email)
    setError(null)
    setEditing(true)
  }

  function cancel() {
    setEditing(false)
    setError(null)
  }

  async function save() {
    const trimmed = draft.trim().toLowerCase()
    if (!trimmed) { setError('Email is required'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) { setError('Invalid email address'); return }
    if (trimmed === email.toLowerCase()) { setEditing(false); return }

    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_email: trimmed }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to update email')
        return
      }
      setEmail(trimmed)
      setEditing(false)
    } catch {
      setError('Failed to update email')
    } finally {
      setSaving(false)
    }
  }

  if (!editing) {
    return (
      <span className="flex items-center gap-1.5 group">
        <span className="text-sm text-gray-600">{email}</span>
        <button
          onClick={startEdit}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-600"
          aria-label="Edit client email"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
      </span>
    )
  }

  return (
    <span className="flex flex-col gap-1">
      <span className="flex items-center gap-1.5">
        <input
          type="email"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          className="rounded border border-gray-300 px-2 py-1 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoFocus
          onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancel() }}
        />
        <button onClick={save} disabled={saving} className="text-green-600 hover:text-green-700 disabled:opacity-50" aria-label="Save">
          <Check className="w-4 h-4" />
        </button>
        <button onClick={cancel} disabled={saving} className="text-gray-400 hover:text-gray-600 disabled:opacity-50" aria-label="Cancel">
          <X className="w-4 h-4" />
        </button>
      </span>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </span>
  )
}
