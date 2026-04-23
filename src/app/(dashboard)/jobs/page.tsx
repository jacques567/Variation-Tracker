'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import JobCard from '@/components/jobs/JobCard'
import type { JobCategory } from '@/types'

export default function JobsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const selectedCategory = searchParams.get('category')

  const [jobs, setJobs] = useState<any[]>([])
  const [categories, setCategories] = useState<JobCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [uncategorizedCount, setUncategorizedCount] = useState(0)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      // Fetch all jobs
      const { data: allJobs } = await supabase
        .from('jobs')
        .select('*, variations(id, cost, status)')
        .eq('contractor_id', user.id)
        .order('created_at', { ascending: false })

      // Fetch categories
      const { data: cats } = await supabase
        .from('job_categories')
        .select('*')
        .eq('contractor_id', user.id)
        .order('name', { ascending: true })

      setJobs(allJobs || [])
      setCategories(cats || [])

      // Count uncategorized
      const uncatCount = (allJobs || []).filter(j => !j.category).length
      setUncategorizedCount(uncatCount)
    } finally {
      setLoading(false)
    }
  }

  // Filter jobs based on selected category
  const filteredJobs = selectedCategory
    ? selectedCategory === 'uncategorized'
      ? jobs.filter(j => !j.category)
      : jobs.filter(j => j.category === selectedCategory)
    : jobs

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Jobs</h1>
          <p className="text-sm text-gray-500 mt-0.5">{jobs?.length ?? 0} total</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/categories"
            className="px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Manage categories
          </Link>
          <Link
            href="/jobs/new"
            className="flex items-center gap-2 bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New job
          </Link>
        </div>
      </div>

      {/* Category filter tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => router.push('/jobs')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            !selectedCategory
              ? 'bg-blue-100 text-blue-700'
              : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          All Jobs ({jobs.length})
        </button>
        {categories.map(cat => {
          const count = jobs.filter(j => j.category === cat.name).length
          return (
            <button
              key={cat.id}
              onClick={() => router.push(`/jobs?category=${encodeURIComponent(cat.name)}`)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === cat.name
                  ? 'bg-blue-100 text-blue-700'
                  : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {cat.name} ({count})
            </button>
          )
        })}
        {uncategorizedCount > 0 && (
          <button
            onClick={() => router.push('/jobs?category=uncategorized')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedCategory === 'uncategorized'
                ? 'bg-blue-100 text-blue-700'
                : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Uncategorized ({uncategorizedCount})
          </button>
        )}
      </div>

      {!filteredJobs.length ? (
        <div className="text-center py-16 text-gray-400">
          <p className="font-medium">No jobs yet</p>
          <p className="text-sm mt-1">Create your first job to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredJobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  )
}
