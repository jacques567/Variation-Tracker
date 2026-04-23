'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Contractor } from '@/types'

interface ContractorDetail extends Contractor {
  job_count: number
  variation_total: number
}

interface JobWithVariations {
  id: string
  job_name: string
  client_name: string
  created_at: string
  original_value: number
  variations?: Array<{
    id: string
    cost: number
    status: string
    created_at: string
    signature?: {
      client_name: string
      signed_at: string
    }
  }>
}

interface EventItem {
  type: 'job' | 'signature'
  id: string
  date: string
  title: string
  detail: string
}

export default function ContractorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [contractorId, setContractorId] = useState<string>('')
  const [contractor, setContractor] = useState<ContractorDetail | null>(null)
  const [jobs, setJobs] = useState<JobWithVariations[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  useEffect(() => {
    params.then(p => {
      setContractorId(p.id)
      loadData(p.id)
    })
  }, [params])

  async function loadData(id: string) {
    try {
      setLoading(true)
      const supabase = createClient()

      // Fetch contractor
      const { data: contractorData } = await supabase
        .from('contractors')
        .select('*')
        .eq('id', id)
        .single()

      if (!contractorData) {
        router.push('/admin/contractors')
        return
      }

      // Fetch jobs with variations
      const { data: jobsData } = await supabase
        .from('jobs')
        .select('id, job_name, client_name, created_at, original_value, variations(id, cost, status, created_at, signature:signatures(client_name, signed_at))')
        .eq('contractor_id', id)
        .order('created_at', { ascending: false })

      const jobCount = jobsData?.length || 0
      const variationTotal = jobsData?.reduce((sum: number, job: any) => {
        const signed = job.variations?.filter((v: any) => v.status === 'signed') || []
        return sum + signed.reduce((s: number, v: any) => s + v.cost, 0)
      }, 0) || 0

      setContractor({
        ...contractorData,
        job_count: jobCount,
        variation_total: variationTotal,
      })
      setJobs((jobsData as unknown as JobWithVariations[]) || [])
    } finally {
      setLoading(false)
    }
  }

  // Build event timeline
  const events = useMemo(() => {
    const eventList: EventItem[] = []

    // Add jobs
    jobs.forEach(job => {
      eventList.push({
        type: 'job',
        id: job.id,
        date: job.created_at,
        title: job.job_name,
        detail: `Created for ${job.client_name}`,
      })

      // Add signatures for this job
      job.variations?.forEach(variation => {
        if (variation.signature) {
          eventList.push({
            type: 'signature',
            id: variation.id,
            date: variation.signature.signed_at,
            title: `${job.job_name} - Signed`,
            detail: `Signed by ${variation.signature.client_name}`,
          })
        }
      })
    })

    // Filter by search
    let filtered = eventList.filter(e => {
      const matchesSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.detail.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesSearch
    })

    // Filter by date range
    if (dateFrom || dateTo) {
      filtered = filtered.filter(e => {
        const eventDate = new Date(e.date)
        if (dateFrom && eventDate < new Date(dateFrom)) return false
        if (dateTo) {
          const toDate = new Date(dateTo)
          toDate.setHours(23, 59, 59)
          if (eventDate > toDate) return false
        }
        return true
      })
    }

    // Sort by date, newest first
    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [jobs, searchQuery, dateFrom, dateTo])

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>
  }

  if (!contractor) {
    return <div>Contractor not found</div>
  }

  return (
    <div>
      <Link href="/admin/contractors" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to contractors
      </Link>

      {/* Contractor Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{contractor.full_name}</h1>
            <p className="text-gray-600 mt-1">{contractor.company_name || 'No company name'}</p>
            <p className="text-sm text-gray-500 mt-1">{contractor.email}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Subscription</p>
            <p className={`text-sm font-semibold mt-1 ${
              contractor.subscription_status === 'active'
                ? 'text-green-600'
                : contractor.subscription_status === 'trialing'
                ? 'text-blue-600'
                : 'text-red-600'
            }`}>
              {contractor.subscription_status || 'none'}
            </p>
            <p className="text-xs text-gray-500 mt-3">Joined {formatDate(contractor.created_at)}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200">
          <div>
            <p className="text-xs text-gray-500">Total Jobs</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{contractor.job_count}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Variation Value</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(contractor.variation_total)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Total Revenue</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {formatCurrency(jobs.reduce((sum, j) => sum + j.original_value, 0) + contractor.variation_total)}
            </p>
          </div>
        </div>
      </div>

      {/* Activity & Filters */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Activity & Jobs</h2>

        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search jobs & events
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                From Date
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To Date
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Events Timeline */}
        <div className="space-y-2">
          {events.map(event => (
            <div key={`${event.type}-${event.id}`} className="bg-white rounded-lg border border-gray-200 p-4 hover:border-blue-300 transition-colors">
              <div className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-2 ${event.type === 'signature' ? 'bg-green-500' : 'bg-blue-500'}`} />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{event.title}</p>
                  <p className="text-sm text-gray-600 mt-0.5">{event.detail}</p>
                  <p className="text-xs text-gray-500 mt-2">{formatDate(event.date)}</p>
                </div>
              </div>
            </div>
          ))}

          {!events.length && (
            <div className="text-center py-12 text-gray-500">
              <p>No activity found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
