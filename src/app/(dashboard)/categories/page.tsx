'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { JobCategory } from '@/types'

interface UncategorizedJob {
  id: string
  job_name: string
  client_name: string
}

export default function CategoriesPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<(JobCategory & { job_count: number })[]>([])
  const [uncategorizedJobs, setUncategorizedJobs] = useState<UncategorizedJob[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [deleteWarning, setDeleteWarning] = useState<string | null>(null)
  const [assigningJobId, setAssigningJobId] = useState<string | null>(null)

  useEffect(() => {
    loadCategories()
  }, [])

  async function loadCategories() {
    try {
      setLoading(true)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      // Fetch categories
      const { data: cats, error: catsError } = await supabase
        .from('job_categories')
        .select('*')
        .eq('contractor_id', user.id)
        .order('name', { ascending: true })

      if (catsError) throw catsError

      // Fetch all jobs and count
      const { data: jobs } = await supabase
        .from('jobs')
        .select('id, category, job_name, client_name')
        .eq('contractor_id', user.id)

      const jobCounts = new Map<string, number>()
      const uncategorized: UncategorizedJob[] = []

      jobs?.forEach(job => {
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

      const categoriesWithCounts = (cats || []).map(cat => ({
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

      setNewCategoryName('')
      await loadCategories()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setCreating(false)
    }
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

  return (
    <div>
      <Link href="/jobs" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to jobs
      </Link>

      <h1 className="text-xl font-semibold text-gray-900 mb-6">Job Categories</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create category form */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">New Category</h2>
          <form onSubmit={handleCreate} className="space-y-3">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="e.g. March 2025, Manchester projects"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={creating || !newCategoryName.trim()}
              className="w-full bg-blue-600 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {creating ? 'Creating...' : 'Create'}
            </button>
          </form>
        </div>

        {/* Uncategorized Jobs section */}
        {uncategorizedJobs.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Assign Jobs to Categories ({uncategorizedJobs.length})</h2>
            <div className="space-y-2">
              {uncategorizedJobs.map(job => (
                <div key={job.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{job.job_name}</p>
                    <p className="text-xs text-gray-500">{job.client_name}</p>
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
                        className="px-2 py-1 text-xs border border-gray-300 rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">-- Select category --</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.name}>{cat.name}</option>
                        ))}
                      </select>
                    ) : (
                      <button
                        onClick={() => setAssigningJobId(job.id)}
                        className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
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
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">All Categories</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {deleteWarning && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800 mb-3">{deleteWarning}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setDeleteWarning(null)}
                  className="px-3 py-1.5 text-sm border border-yellow-300 rounded hover:bg-yellow-100"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const cat = categories.find(c => c.job_count > 0)
                    if (cat) confirmDelete(cat.id)
                  }}
                  className="px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Delete Anyway
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : categories.length === 0 ? (
            <p className="text-sm text-gray-500">No categories yet. Create one to get started!</p>
          ) : (
            <div className="space-y-2">
              {categories.map(cat => (
                <div key={cat.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{cat.name}</p>
                    <p className="text-xs text-gray-500">{cat.job_count} job{cat.job_count === 1 ? '' : 's'}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(cat.id, cat.name, cat.job_count)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Delete category"
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
  )
}
