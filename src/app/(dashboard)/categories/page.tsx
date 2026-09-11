'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Plus, Trash2, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { readJobFormDraft, writeJobFormDraft } from '@/lib/jobFormDraft'
import { CategoryListSkeleton } from '@/components/ui/Skeleton'
import type { JobCategory } from '@/types'

interface UncategorizedJob {
  id: string
  job_name: string
  client_name: string
}

export default function CategoriesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnTo = searchParams.get('returnTo')
  const [categories, setCategories] = useState<(JobCategory & { job_count: number })[]>([])
  const [uncategorizedJobs, setUncategorizedJobs] = useState<UncategorizedJob[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [deleteWarning, setDeleteWarning] = useState<string | null>(null)
  const [assigningJobId, setAssigningJobId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('')

  useEffect(() => {
    loadCategories()
  }, [])

  async function loadCategories() {
    try {
      setLoading(true)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)

      const { data: cats, error: catsError } = await supabase
        .from('job_categories')
        .select('*')
        .eq('contractor_id', user.id)
        .order('name', { ascending: true })

      if (catsError) throw catsError

      const { data: jobs } = await supabase
        .from('jobs')
        .select('id, category, job_name, client_name')
        .eq('contractor_id', user.id)

      const jobCounts = new Map<string, number>()
      const uncategorized: UncategorizedJob[] = []

      jobs?.forEach((job: any) => {
        if (job.category) {
          jobCounts.set(job.category, (jobCounts.get(job.category) || 0) + 1)
        } else {
          uncategorized.push({
            id: job.id,
            job_name: job.job_name,
            client_name: job.client_name,
          })
        }
      })

      const categoriesWithCounts = (cats || []).map((cat: any) => ({
        ...cat,
        job_count: jobCounts.get(cat.name) || 0,
      }))

      setCategories(categoriesWithCounts)
      setUncategorizedJobs(uncategorized)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newCategoryName.trim()) return

    try {
      setCreating(true)
      setError(null)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error: insertError } = await supabase
        .from('job_categories')
        .insert({
          contractor_id: user.id,
          name: newCategoryName.trim(),
        })

      if (insertError) {
        if (insertError.message.includes('duplicate')) {
          setError('Category already exists')
        } else {
          setError(insertError.message)
        }
        return
      }

      if (returnTo) {
        setSelectedCategory(newCategoryName.trim())
      }
      setNewCategoryName('')
      await loadCategories()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setCreating(false)
    }
  }

  function confirmAndReturn() {
    if (!returnTo) return
    const draft = readJobFormDraft(userId)
    writeJobFormDraft(userId, { ...(draft ?? {
      job_name: '', address: '', original_value: '', category: '',
      client_name: '', client_email: '', client_email_confirm: '', client_phone: ''
    }), category: selectedCategory })
    router.push(returnTo)
  }

  async function handleDelete(categoryId: string, categoryName: string, jobCount: number) {
    if (jobCount > 0) {
      setDeleteWarning(`This category has ${jobCount} job${jobCount === 1 ? '' : 's'}. Are you sure you want to delete it?`)
      return
    }

    try {
      const supabase = createClient()
      const { error: deleteError } = await supabase
        .from('job_categories')
        .delete()
        .eq('id', categoryId)

      if (deleteError) throw deleteError
      setDeleteWarning(null)
      await loadCategories()
    } catch (err: any) {
      setError(err.message)
    }
  }

  async function confirmDelete(categoryId: string) {
    try {
      const supabase = createClient()
      const { error: deleteError } = await supabase
        .from('job_categories')
        .delete()
        .eq('id', categoryId)

      if (deleteError) throw deleteError
      setDeleteWarning(null)
      await loadCategories()
    } catch (err: any) {
      setError(err.message)
    }
  }

  async function assignJobToCategory(jobId: string, categoryName: string) {
    try {
      const supabase = createClient()
      const { error: updateError } = await supabase
        .from('jobs')
        .update({ category: categoryName })
        .eq('id', jobId)

      if (updateError) throw updateError
      setAssigningJobId(null)
      await loadCategories()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const inputClass = 'w-full h-[42px] rounded-[10px] border border-[#AEB8C7] px-3.5 text-sm bg-white text-vt-dark focus:outline-none focus:border-vt-primary focus:ring-4 focus:ring-vt-primary/15'

  return (
    <div>
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-vt-muted hover:text-vt-dark mb-5 bg-none border-none cursor-pointer">
        <ArrowLeft className="w-4 h-4" /> Back to jobs
      </button>

      {returnTo && (
        <span className="inline-block text-xs font-semibold text-vt-primary bg-[#E5EEFA] rounded-md px-2 py-1 mb-3">
          Continuing job creation
        </span>
      )}

      <h1 className="text-2xl font-semibold text-vt-dark mb-[22px]">Job Categories</h1>

      <div className="grid grid-cols-1 sm:grid-cols-[280px_1fr] gap-5 items-start">
        {/* Create category form */}
        <div className="bg-white rounded-xl border border-vt-border p-5">
          <h2 className="text-sm font-semibold text-vt-dark mb-3.5">New Category</h2>
          <form onSubmit={handleCreate} className="flex flex-col gap-2.5">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="e.g. Kitchens, Bathrooms, Extensions"
              className={inputClass}
            />
            <button
              type="submit"
              disabled={creating || !newCategoryName.trim()}
              className="w-full bg-vt-primary text-white rounded-[10px] px-4 py-[11px] text-sm font-semibold hover:bg-vt-primary-hover disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              {creating ? 'Creating…' : 'Create'}
            </button>
          </form>

          {returnTo && categories.length > 0 && (
            <>
              <hr className="border-vt-border my-4" />
              <label className="block text-xs text-vt-muted mb-1.5">Select category to use</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className={`${inputClass} mb-3`}
              >
                <option value="">-- No category --</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
              <button
                onClick={confirmAndReturn}
                className="w-full border border-vt-primary text-vt-primary rounded-[10px] px-4 py-[11px] text-sm font-semibold hover:bg-[#E5EEFA] transition-colors"
              >
                Confirm & continue job
              </button>
            </>
          )}
        </div>

        <div className="flex flex-col gap-5">
          {/* Uncategorized Jobs section */}
          {uncategorizedJobs.length > 0 && (
            <div className="bg-white rounded-xl border border-vt-border p-5">
              <h2 className="text-sm font-semibold text-vt-dark mb-3.5">Assign Jobs to Categories ({uncategorizedJobs.length})</h2>
              <div className="flex flex-col gap-2">
                {uncategorizedJobs.map(job => (
                  <div key={job.id} className="flex items-center justify-between p-3 px-3.5 bg-[#F7F9FB] rounded-[10px]">
                    <div>
                      <p className="text-sm font-semibold text-vt-dark">{job.job_name}</p>
                      <p className="text-xs text-vt-muted mt-0.5">{job.client_name}</p>
                    </div>
                    <div className="flex gap-2">
                      {assigningJobId === job.id ? (
                        <select
                          autoFocus
                          onChange={(e) => {
                            if (e.target.value) {
                              assignJobToCategory(job.id, e.target.value)
                            }
                          }}
                          className="px-2 py-1 text-xs border border-[#AEB8C7] rounded-lg bg-white text-vt-dark focus:outline-none focus:border-vt-primary focus:ring-4 focus:ring-vt-primary/15"
                        >
                          <option value="">-- Select category --</option>
                          {categories.map(cat => (
                            <option key={cat.id} value={cat.name}>{cat.name}</option>
                          ))}
                        </select>
                      ) : (
                        <button
                          onClick={() => setAssigningJobId(job.id)}
                          className="px-3.5 py-1.5 text-sm font-semibold bg-vt-primary text-white rounded-lg hover:bg-vt-primary-hover transition-colors"
                        >
                          Assign
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Categories list */}
          <div className="bg-white rounded-xl border border-vt-border p-5">
            <h2 className="text-sm font-semibold text-vt-dark mb-3.5">All Categories</h2>

            {error && (
              <div className="mb-4 p-3 bg-vt-error-bg border border-vt-error/20 rounded-xl flex gap-2">
                <AlertCircle className="w-4 h-4 text-vt-error flex-shrink-0 mt-0.5" />
                <p className="text-sm text-vt-error">{error}</p>
              </div>
            )}

            {deleteWarning && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
                <p className="text-sm text-yellow-800 mb-3">{deleteWarning}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setDeleteWarning(null)}
                    className="px-3 py-1.5 text-sm border border-yellow-300 rounded-lg hover:bg-yellow-100"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      const cat = categories.find(c => c.job_count > 0)
                      if (cat) confirmDelete(cat.id)
                    }}
                    className="px-3 py-1.5 text-sm bg-vt-error text-white rounded-lg hover:opacity-90"
                  >
                    Delete Anyway
                  </button>
                </div>
              </div>
            )}

            {loading ? (
              <CategoryListSkeleton />
            ) : categories.length === 0 ? (
              <p className="text-sm text-vt-muted">No categories yet. Create one to get started!</p>
            ) : (
              <div className="flex flex-col gap-2">
                {categories.map(cat => (
                  <div key={cat.id} className="flex items-center justify-between p-3 px-3.5 bg-[#F7F9FB] rounded-[10px] hover:bg-gray-100 transition-colors">
                    <div>
                      <p className="text-sm font-semibold text-vt-dark">{cat.name}</p>
                      <p className="text-xs text-vt-muted mt-0.5">{cat.job_count} job{cat.job_count === 1 ? '' : 's'}</p>
                    </div>
                    <button
                      onClick={() => handleDelete(cat.id, cat.name, cat.job_count)}
                      className="p-3.5 -m-3.5 text-[#7C8798] hover:text-vt-error hover:bg-red-50 rounded transition-colors"
                      aria-label={`Delete ${cat.name} category`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
