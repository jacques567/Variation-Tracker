'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Upload, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { evaluateSubscription, isBetaMode } from '@/lib/subscription-evaluation'
import { use } from 'react'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export default function NewVariationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: jobId } = use(params)
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoError, setPhotoError] = useState<string | null>(null)

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setPhotoError(null)
    if (file.size > MAX_FILE_SIZE) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1)
      setPhotoError(`Photo too large (${sizeMB}MB). Max 5MB.`)
      setPhotoFile(null)
      setPhotoPreview(null)
      return
    }

    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  function removePhoto() {
    setPhotoFile(null)
    setPhotoPreview(null)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const form = new FormData(e.currentTarget)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    // Subscription check — client-side UX guard. RLS enforces this at the DB
    // layer regardless (migration 016), but checking here gives the user a clear
    // error message before any storage upload is attempted.
    const { data: contractor } = await supabase
      .from('contractors')
      .select('subscription_status, trial_ends_at, grace_period_expires_at')
      .eq('id', user.id)
      .single()

    const { isValid, reason } = evaluateSubscription(contractor)
    if (!isBetaMode() && !isValid) {
      setError(reason ?? 'Your subscription has expired. Please subscribe to continue.')
      setLoading(false)
      return
    }

    let photoUrl: string | null = null

    if (photoFile) {
      const ext = photoFile.name.split('.').pop()
      const path = `${user.id}/${jobId}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('variation-photos')
        .upload(path, photoFile, { upsert: false })

      if (uploadError) {
        setError('Photo upload failed: ' + uploadError.message)
        setLoading(false)
        return
      }

      const { data: urlData } = supabase.storage
        .from('variation-photos')
        .getPublicUrl(path)
      photoUrl = urlData.publicUrl
    }

    const costPounds = parseFloat(form.get('cost') as string) || 0

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    const { error: insertError } = await supabase.from('variations').insert({
      job_id: jobId,
      description: form.get('description') as string,
      cost: Math.round(costPounds * 100),
      date: form.get('date') as string,
      photo_url: photoUrl,
      status: 'draft',
      signature_token_expires_at: expiresAt.toISOString(),
    })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    router.push(`/jobs/${jobId}`)
    router.refresh()
  }

  const inputClass = 'w-full h-[42px] rounded-[10px] border border-[#AEB8C7] px-3.5 text-sm bg-white text-vt-dark focus:outline-none focus:border-vt-primary focus:ring-4 focus:ring-vt-primary/15'
  const labelClass = 'block text-sm font-semibold text-vt-dark mb-1.5'

  return (
    <div>
      <Link href={`/jobs/${jobId}`} className="flex items-center gap-1.5 text-sm text-vt-muted hover:text-vt-dark mb-5">
        <ArrowLeft className="w-4 h-4" /> Back to job
      </Link>

      <h1 className="text-[28px] font-semibold text-vt-dark mb-5">Log variation</h1>

      <div className="max-w-[640px] bg-white rounded-xl border border-vt-border p-8 shadow-[0_1px_2px_rgba(15,23,32,0.04)]">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className={labelClass}>
              Description <span className="text-vt-error">*</span>
            </label>
            <textarea name="description" required rows={3}
              className="w-full rounded-[10px] border border-[#AEB8C7] px-3.5 py-3 text-sm bg-white text-vt-dark focus:outline-none focus:border-vt-primary focus:ring-4 focus:ring-vt-primary/15 resize-none"
              placeholder="e.g. Additional soil removal required due to unexpected rock layer at 1.2m depth" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>
                Cost <span className="text-vt-error">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-vt-muted">£</span>
                <input name="cost" type="number" step="0.01" required
                  className={`${inputClass} pl-7`}
                  placeholder="350.00" />
              </div>
            </div>
            <div>
              <label className={labelClass}>
                Date <span className="text-vt-error">*</span>
              </label>
              <input name="date" type="date" required
                defaultValue={new Date().toISOString().split('T')[0]}
                className={inputClass} />
            </div>
          </div>

          {/* Photo upload */}
          <div>
            <label className={labelClass}>
              Photo proof <span className="font-normal text-vt-muted">(optional, max 5MB)</span>
            </label>
            {photoPreview ? (
              // overflow-hidden lives on the inner wrapper around the <img> only —
              // putting it on this outer relative container instead clipped the
              // corner of the absolutely-positioned remove button against the
              // rounded border.
              <div className="relative w-full">
                <a href={photoPreview} target="_blank" rel="noopener noreferrer"
                  className="block w-full rounded-[10px] overflow-hidden border border-[#AEB8C7] cursor-zoom-in">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photoPreview} alt="Preview" className="w-full max-h-48 object-contain bg-[#F7F9FB]" />
                </a>
                <button type="button" onClick={removePhoto}
                  className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-sm border border-vt-border hover:bg-gray-50">
                  <X className="w-4 h-4 text-vt-muted" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-[120px] rounded-[10px] border-2 border-dashed border-[#AEB8C7] cursor-pointer hover:border-vt-primary hover:bg-[#E5EEFA] transition-colors">
                <Upload className="w-[22px] h-[22px] text-vt-muted mb-1.5" />
                <span className="text-sm text-vt-muted">Tap to upload photo or receipt</span>
                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoChange} />
              </label>
            )}
            {photoError && (
              <p className="text-sm text-vt-error mt-2">{photoError}</p>
            )}
          </div>

          {error && (
            <p className="text-sm text-vt-error bg-vt-error-bg rounded-xl px-3 py-2">{error}</p>
          )}

          <div className="flex gap-3 pt-1">
            <Link href={`/jobs/${jobId}`}
              className="flex-1 text-center rounded-[10px] border border-[#AEB8C7] px-4 py-[11px] text-sm font-semibold text-vt-dark hover:bg-gray-50 transition-colors">
              Cancel
            </Link>
            <button type="submit" disabled={loading}
              className="flex-1 bg-vt-primary text-white rounded-[10px] px-4 py-[11px] text-sm font-semibold hover:bg-vt-primary-hover disabled:opacity-50 transition-colors">
              {loading ? 'Saving…' : 'Log variation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
