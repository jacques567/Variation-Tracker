'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Plus, CheckCircle, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import JobCard from '@/components/jobs/JobCard'
import PaymentWarning from '@/components/ui/PaymentWarning'
import type { JobCategory } from '@/types'

interface Contractor {
  subscription_status: string | null
  grace_period_expires_at: string | null
}

export default function JobsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const selectedCategory = searchParams.get('category')
  const justSubscribed = searchParams.get('subscribed') === 'true'

  const [jobs, setJobs] = useState<any[]>([])
  const [categories, setCategories] = useState<JobCategory[]>([])
  const [contractor, setContractor] = useState<Contractor | null>(null)
  const [loading, setLoading] = useState(true)
  const [uncategorizedCount, setUncategorizedCount] = useState(0)
  const [showSubscribedBanner, setShowSubscribedBanner] = useState(justSubscribed)

  async function loadData() {
    try {
      setLoading(true)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      // Fetch contractor subscription info
      const { data: contractorData } = await supabase
        .from('contractors')
        .select('subscription_status, grace_period_expires_at')
        .eq('id', user.id)
        .single()

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

      setContractor(contractorData)
      setJobs(allJobs || [])
      setCategories(cats || [])

      // Count uncategorized
      const uncatCount = (allJobs || []).filter((j: any) => !j.category).length
      setUncategorizedCount(uncatCount)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Filter jobs based on selected category
  const filteredJobs = selectedCategory
    ? selectedCategory === 'uncategorized'
      ? jobs.filter(j => !j.category)
      : jobs.filter(j => j.category === selectedCategory)
    : jobs

  const gracePeriodDaysRemaining = contractor?.grace_period_expires_at
    ? Math.ceil((new Date(contractor.grace_period_expires_at).getTime() - Date.now()) / 86400000)
    : null

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>
  }

  return (
    <div>
      {showSubscribedBanner && (
        <div
          role="status"
          aria-live="polite"
          className="mb-4 bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2 text-sm text-green-800">
            <CheckCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>You&apos;re subscribed. Full access unlocked.</span>
          </div>
          <button
            onClick={() => setShowSubscribedBanner(false)}
            aria-label="Dismiss"
            className="text-green-600 hover:text-green-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
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

      {/* Payment warning */}
      <PaymentWarning
        subscriptionStatus={contractor?.subscription_status ?? null}
        daysRemaining={gracePeriodDaysRemaining}
      />

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
