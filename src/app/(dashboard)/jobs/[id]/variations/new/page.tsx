'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Upload, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { use } from 'react'

export default function NewVariationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: jobId } = use(params)
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
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

    const { error: insertError } = await supabase.from('variations').insert({
      job_id: jobId,
      description: form.get('description') as string,
      cost: Math.round(costPounds * 100),
      date: form.get('date') as string,
      photo_url: photoUrl,
      status: 'draft',
    })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    router.push(`/jobs/${jobId}`)
    router.refresh()
  }

  return (
    <div>
      <Link href={`/jobs/${jobId}`} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to job
      </Link>

      <h1 className="text-xl font-semibold text-gray-900 mb-6">Log variation</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea name="description" required rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="e.g. Additional soil removal required due to unexpected rock layer at 1.2m depth" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cost (£)</label>
              <input name="cost" type="number" step="0.01" required
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="350.00" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input name="date" type="date" required
                defaultValue={new Date().toISOString().split('T')[0]}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          {/* Photo upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Photo proof <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            {photoPreview ? (
              <div className="relative w-full rounded-lg overflow-hidden border border-gray-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photoPreview} alt="Preview" className="w-full max-h-48 object-cover" />
                <button type="button" onClick={removePhoto}
                  className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-sm border border-gray-200 hover:bg-gray-50">
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-28 rounded-lg border-2 border-dashed border-gray-300 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                <Upload className="w-5 h-5 text-gray-400 mb-1" />
                <span className="text-sm text-gray-400">Tap to upload photo or receipt</span>
                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoChange} />
              </label>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <Link href={`/jobs/${jobId}`}
              className="flex-1 text-center rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              Cancel
            </Link>
            <button type="submit" disabled={loading}
              className="flex-1 bg-blue-600 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {loading ? 'Saving...' : 'Log variation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
