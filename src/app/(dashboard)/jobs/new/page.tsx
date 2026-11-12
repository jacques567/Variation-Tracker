'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { evaluateSubscription, isBetaMode } from '@/lib/subscription-evaluation'
import PostcodeLookup from '@/components/jobs/PostcodeLookup'
import { readJobFormDraft, writeJobFormDraft, clearJobFormDraft } from '@/lib/jobFormDraft'
import type { JobCategory } from '@/types'

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
    client_email_confirm: '',
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
      const saved = readJobFormDraft(user.id)
      if (saved) {
        setFormData(saved)
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
    writeJobFormDraft(userIdRef.current, newData)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    if (missingFields.size > 0) {
      setShowValidation(true)
      return
    }
    setShowValidation(false)

    if (formData.client_email.toLowerCase() !== formData.client_email_confirm.toLowerCase()) {
      setError('Email addresses do not match')
      return
    }

    setLoading(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) { router.push('/login'); return }

    const { data: contractor, error: contractorError } = await supabase
      .from('contractors')
      .select('subscription_status, trial_ends_at, grace_period_expires_at')
      .eq('id', user.id)
      .single()

    if (contractorError) {
      console.error('Failed to load contractor record:', contractorError)
      setError('Unable to verify your account right now. Please try again or contact support.')
      setLoading(false)
      return
    }

    const { isValid, reason } = evaluateSubscription(contractor)
    if (!isBetaMode() && !isValid) {
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

    clearJobFormDraft(userIdRef.current)
    router.push(`/jobs/${data.id}`)
  }

  const inputClass = 'w-full h-[42px] rounded-[10px] border border-[#AEB8C7] px-3.5 text-sm bg-white text-vt-dark focus:outline-none focus:border-vt-primary focus:ring-4 focus:ring-vt-primary/15'
  const labelClass = 'block text-sm font-semibold text-vt-dark mb-1.5'

  return (
    <div>
      <Link href="/jobs" className="flex items-center gap-1.5 text-sm text-vt-muted hover:text-vt-dark mb-5">
        <ArrowLeft className="w-4 h-4" /> Back to jobs
      </Link>

      <h1 className="text-2xl font-semibold text-vt-dark mb-5">New job</h1>

      <div className="max-w-[640px] mx-auto bg-white rounded-xl border border-vt-border p-8 shadow-[0_1px_2px_rgba(15,23,32,0.04)]">
        <form ref={formRef} onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
          <div>
            <label className={labelClass}>
              Job name{showValidation && missingFields.has('job_name') && <span className="text-vt-error"> *</span>}
            </label>
            <input name="job_name" type="text" value={formData.job_name} onChange={handleInputChange}
              className={inputClass}
              placeholder="e.g. Kitchen extension – 14 Maple St" />
          </div>

          <div>
            <label className={labelClass}>
              Site address{showValidation && missingFields.has('address') && <span className="text-vt-error"> *</span>}
            </label>
            {formLoaded && (
              <PostcodeLookup
                initialValue={formData.address}
                onAddressChange={address => {
                  const newData = { ...formData, address }
                  setFormData(newData)
                  writeJobFormDraft(userIdRef.current, newData)
                }}
              />
            )}
          </div>

          <div>
            <label className={labelClass}>
              Original contract value{showValidation && missingFields.has('original_value') && <span className="text-vt-error"> *</span>}
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-vt-muted">£</span>
              <input name="original_value" type="number" min="0" step="0.01" value={formData.original_value} onChange={handleInputChange}
                className={`${inputClass} pl-7`}
                placeholder="5,000.00" />
            </div>
          </div>

          <div>
            <label className={labelClass}>Category</label>
            <select name="category" value={formData.category} onChange={handleInputChange}
              className={inputClass}>
              <option value="">No category</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
            <p className="text-xs text-vt-muted mt-1.5">
              <Link href="/categories?returnTo=/jobs/new" className="text-vt-primary font-semibold hover:underline">Manage categories</Link>
            </p>
          </div>

          <hr className="border-[#EEF1F5] my-1" />
          <p className="text-sm font-semibold text-vt-dark -mt-3">Client details</p>

          <div>
            <label className={labelClass}>
              Client name{showValidation && missingFields.has('client_name') && <span className="text-vt-error"> *</span>}
            </label>
            <input name="client_name" type="text" value={formData.client_name} onChange={handleInputChange}
              className={inputClass}
              placeholder="John Smith" />
          </div>

          <div>
            <label className={labelClass}>
              Client email{showValidation && missingFields.has('client_email') && <span className="text-vt-error"> *</span>}
            </label>
            <input name="client_email" type="email" value={formData.client_email} onChange={handleInputChange}
              className={inputClass}
              placeholder="john@example.com" />
          </div>

          <div>
            <label className={labelClass}>Confirm client email</label>
            <input name="client_email_confirm" type="email" value={formData.client_email_confirm} onChange={handleInputChange}
              className={inputClass}
              placeholder="john@example.com" />
          </div>

          <div>
            <label className={labelClass}>Client phone</label>
            <input name="client_phone" type="tel" value={formData.client_phone} onChange={handleInputChange}
              className={inputClass}
              placeholder="07700 900000" />
          </div>

          {error && (
            <p className="text-sm text-vt-error bg-vt-error-bg rounded-xl px-3 py-2">{error}</p>
          )}

          <div className="flex gap-3 pt-1">
            <Link href="/jobs"
              className="flex-1 text-center rounded-[10px] border border-[#AEB8C7] px-4 py-[11px] text-sm font-semibold text-vt-dark hover:bg-gray-50 transition-colors">
              Cancel
            </Link>
            <button type="submit" disabled={loading}
              className="flex-1 bg-vt-primary text-white rounded-[10px] px-4 py-[11px] text-sm font-semibold hover:bg-vt-primary-hover disabled:opacity-50 transition-colors">
              {loading ? 'Creating…' : 'Create job'}
            </button>
          </div>

          {showValidation && missingFields.size > 0 && (
            <p className="text-sm text-vt-error text-center">Not all fields are filled in</p>
          )}
        </form>
      </div>
    </div>
  )
}
