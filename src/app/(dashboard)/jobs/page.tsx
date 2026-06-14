'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import NextLink from 'next/link'
import { Plus, CheckCircle, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/primitives/Button'
import JobCard from '@/components/jobs/JobCard'
import { PaymentWarning } from '@/components/PaymentWarning'
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

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 'var(--spacing-3xl) 0', color: 'var(--color-text-secondary)' }}>Loading...</div>
  }

  return (
    <div>
      {showSubscribedBanner && (
        <div
          role="status"
          aria-live="polite"
          style={{
            marginBottom: 'var(--spacing-md)',
            background: '#f0fdf4',
            border: '1px solid #86efac',
            padding: 'var(--spacing-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--spacing-md)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', fontSize: 'var(--font-size-sm)', color: '#166534' }}>
            <CheckCircle style={{ width: '1rem', height: '1rem', flexShrink: 0 }} aria-hidden="true" />
            <span>You&apos;re subscribed. Full access unlocked.</span>
          </div>
          <button
            onClick={() => setShowSubscribedBanner(false)}
            aria-label="Dismiss"
            style={{
              background: 'none',
              border: 'none',
              color: '#16a34a',
              cursor: 'pointer',
              padding: 0,
              fontSize: 'var(--font-size-sm)',
            }}
          >
            <X style={{ width: '1rem', height: '1rem' }} />
          </button>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--spacing-lg)' }}>
        <div>
          <h1 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-bold)', marginBottom: 'var(--spacing-sm)' }}>
            Jobs
          </h1>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
            {jobs?.length ?? 0} total
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
          <NextLink href="/categories">
            <Button variant="secondary" style={{ fontSize: 'var(--font-size-sm)', padding: 'var(--spacing-sm) var(--spacing-md)' }}>
              Manage categories
            </Button>
          </NextLink>
          <NextLink href="/jobs/new">
            <Button style={{ fontSize: 'var(--font-size-sm)', padding: 'var(--spacing-sm) var(--spacing-md)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
              <Plus style={{ width: '1rem', height: '1rem' }} />
              New job
            </Button>
          </NextLink>
        </div>
      </div>

      {/* Payment warning */}
      <PaymentWarning
        status={contractor?.subscription_status}
        gracePeriodExpiresAt={contractor?.grace_period_expires_at}
      />

      {/* Category filter tabs */}
      <div style={{ marginBottom: 'var(--spacing-lg)', display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-sm)' }}>
        <button
          onClick={() => router.push('/jobs')}
          style={{
            padding: 'var(--spacing-sm) var(--spacing-md)',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 'var(--font-weight-medium)',
            border: selectedCategory ? `1px solid var(--color-border-light)` : `2px solid var(--color-primary)`,
            background: selectedCategory ? 'transparent' : 'var(--color-background-primary)',
            color: selectedCategory ? 'var(--color-text-primary)' : 'var(--color-primary)',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)',
          }}
        >
          All Jobs ({jobs.length})
        </button>
        {categories.map(cat => {
          const count = jobs.filter(j => j.category === cat.name).length
          const isSelected = selectedCategory === cat.name
          return (
            <button
              key={cat.id}
              onClick={() => router.push(`/jobs?category=${encodeURIComponent(cat.name)}`)}
              style={{
                padding: 'var(--spacing-sm) var(--spacing-md)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 'var(--font-weight-medium)',
                border: isSelected ? `2px solid var(--color-primary)` : `1px solid var(--color-border-light)`,
                background: isSelected ? 'var(--color-background-primary)' : 'transparent',
                color: isSelected ? 'var(--color-primary)' : 'var(--color-text-primary)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
            >
              {cat.name} ({count})
            </button>
          )
        })}
        {uncategorizedCount > 0 && (
          <button
            onClick={() => router.push('/jobs?category=uncategorized')}
            style={{
              padding: 'var(--spacing-sm) var(--spacing-md)',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 'var(--font-weight-medium)',
              border: selectedCategory === 'uncategorized' ? `2px solid var(--color-primary)` : `1px solid var(--color-border-light)`,
              background: selectedCategory === 'uncategorized' ? 'var(--color-background-primary)' : 'transparent',
              color: selectedCategory === 'uncategorized' ? 'var(--color-primary)' : 'var(--color-text-primary)',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
          >
            Uncategorized ({uncategorizedCount})
          </button>
        )}
      </div>

      {!filteredJobs.length ? (
        <div style={{ textAlign: 'center', padding: 'var(--spacing-4xl) 0', color: 'var(--color-text-secondary)' }}>
          <p style={{ fontWeight: 'var(--font-weight-medium)' }}>No jobs yet</p>
          <p style={{ fontSize: 'var(--font-size-sm)', marginTop: 'var(--spacing-sm)' }}>Create your first job to get started</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          {filteredJobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  )
}
