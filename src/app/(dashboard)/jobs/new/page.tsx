'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { JobCategory } from '@/types'

export default function NewJobPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<JobCategory[]>([])

  async function loadCategories() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('job_categories')
      .select('*')
      .eq('contractor_id', user.id)
      .order('name', { ascending: true })

    setCategories(data || [])
  }

  useEffect(() => {
    loadCategories()
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const form = new FormData(e.currentTarget)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) { router.push('/login'); return }

    const originalValuePounds = parseFloat(form.get('original_value') as string) || 0
    const categoryValue = form.get('category') as string || null

    const { data, error } = await supabase.from('jobs').insert({
      contractor_id: user.id,
      job_name: form.get('job_name') as string,
      client_name: form.get('client_name') as string,
      client_email: form.get('client_email') as string,
      client_phone: form.get('client_phone') as string || null,
      address: form.get('address') as string,
      original_value: Math.round(originalValuePounds * 100),
      category: categoryValue,
    }).select().single()

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push(`/jobs/${data.id}`)
  }

  return (
    <div>
      <Link href="/jobs" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to jobs
      </Link>

      <h1 className="text-xl font-semibold text-gray-900 mb-6">New job</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Job name</label>
            <input name="job_name" type="text" required
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Kitchen extension – 14 Maple St" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Site address</label>
            <input name="address" type="text" required
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="14 Maple Street, Manchester, M1 1AB" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Original contract value (£)</label>
            <input name="original_value" type="number" min="0" step="0.01" required
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="5000.00" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select name="category"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">-- No category --</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              <Link href="/categories" className="text-blue-600 hover:underline">Manage categories</Link>
            </p>
          </div>

          <hr className="border-gray-100" />
          <p className="text-sm font-medium text-gray-700">Client details</p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client name</label>
            <input name="client_name" type="text" required
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="John Smith" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client email</label>
              <input name="client_email" type="email" required
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="john@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client phone</label>
              <input name="client_phone" type="tel"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="07700 900000" />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <Link href="/jobs"
              className="flex-1 text-center rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              Cancel
            </Link>
            <button type="submit" disabled={loading}
              className="flex-1 bg-blue-600 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {loading ? 'Creating...' : 'Create job'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
