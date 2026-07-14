'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { evaluateSubscription } from '@/lib/subscription-evaluation'
import PostcodeLookup from '@/components/jobs/PostcodeLookup'
import type { JobCategory } from '@/types'

const STORAGE_KEY_PREFIX = 'job_form_draft'

export default function NewJobPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<JobCategory[]>([])
  const [formData, setFormData] = useState({
    job_name: '',
    address: '',
    original_value: '',
    category: '',
    client_name: '',
    client_email: '',
    client_phone: ''
  })
  const [formLoaded, setFormLoaded] = useState(false)
  const [showValidation, setShowValidation] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const userIdRef = useRef<string | null>(null)

  const REQUIRED_FIELDS = ['job_name', 'address', 'original_value', 'client_name', 'client_email'] as const
  const missingFields = new Set(
    REQUIRED_FIELDS.filter(field => !formData[field]?.toString().trim())
  )

  function getStorageKey(): string {
    if (!userIdRef.current) return STORAGE_KEY_PREFIX
    return `${STORAGE_KEY_PREFIX}_${userIdRef.current}`
  }

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
    async function initForm() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      userIdRef.current = user.id
      const saved = sessionStorage.getItem(getStorageKey())
      if (saved) {
        setFormData(JSON.parse(saved))
      }
      setFormLoaded(true)
    }

    loadCategories()
    initForm()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    const newData = { ...formData, [name]: value }
    setFormData(newData)
    sessionStorage.setItem(getStorageKey(), JSON.stringify(newData))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    if (missingFields.size > 0) {
      setShowValidation(true)
      return
    }
    setShowValidation(false)
    setLoading(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) { router.push('/login'); return }

    // Subscription check — client-side UX guard. RLS enforces this at the DB
    // layer regardless, but checking here gives the user a clear error message
    // instead of a raw Supabase permission error.
    const { data: contractor } = await supabase
      .from('contractors')
      .select('subscription_status, trial_ends_at, grace_period_expires_at')
      .eq('id', user.id)
      .single()

    const { isValid, reason } = evaluateSubscription(contractor)
    if (!isValid) {
      setError(reason ?? 'Your subscription has expired. Please subscribe to continue.')
      setLoading(false)
      return
    }

    const originalValuePounds = parseFloat(formData.original_value) || 0
    const categoryValue = formData.category || null

    const { data, error } = await supabase.from('jobs').insert({
      contractor_id: user.id,
      job_name: formData.job_name,
      client_name: formData.client_name,
      client_email: formData.client_email,
      client_phone: formData.client_phone || null,
      address: formData.address,
      original_value: Math.round(originalValuePounds * 100),
      category: categoryValue,
    }).select().single()

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    sessionStorage.removeItem(getStorageKey())
    router.push(`/jobs/${data.id}`)
  }

  return (
    <div>
      <Link href="/jobs" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to jobs
      </Link>

      <h1 className="text-xl font-semibold text-gray-900 mb-6">New job</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <form ref={formRef} onSubmit={handleSubmit} noValidate className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Job name{showValidation && missingFields.has('job_name') && <span className="text-red-600"> *</span>}
            </label>
            <input name="job_name" type="text" value={formData.job_name} onChange={handleInputChange}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Kitchen extension – 14 Maple St" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Site address{showValidation && missingFields.has('address') && <span className="text-red-600"> *</span>}
            </label>
            {formLoaded && (
              <PostcodeLookup
                initialValue={formData.address}
                onAddressChange={address => {
                  const newData = { ...formData, address }
                  setFormData(newData)
                  sessionStorage.setItem(getStorageKey(), JSON.stringify(newData))
                }}
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Original contract value (£){showValidation && missingFields.has('original_value') && <span className="text-red-600"> *</span>}
            </label>
            <input name="original_value" type="number" min="0" step="0.01" value={formData.original_value} onChange={handleInputChange}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="5000.00" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select name="category" value={formData.category} onChange={handleInputChange}
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Client name{showValidation && missingFields.has('client_name') && <span className="text-red-600"> *</span>}
            </label>
            <input name="client_name" type="text" value={formData.client_name} onChange={handleInputChange}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="John Smith" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Client email{showValidation && missingFields.has('client_email') && <span className="text-red-600"> *</span>}
              </label>
              <input name="client_email" type="email" value={formData.client_email} onChange={handleInputChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="john@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client phone</label>
              <input name="client_phone" type="tel" value={formData.client_phone} onChange={handleInputChange}
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

          {showValidation && missingFields.size > 0 && (
            <p className="text-sm text-red-600 text-center">Not all fields are filled in</p>
          )}
        </form>
      </div>
    </div>
  )
}
