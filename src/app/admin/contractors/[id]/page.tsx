'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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

  useEffect(() => {
    params.then(p => {
      setContractorId(p.id)
      loadData(p.id)
    })
  }, [params])

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

  const subscriptionColor =
    contractor.subscription_status === 'active' ? 'text-vt-success'
    : contractor.subscription_status === 'trialing' ? 'text-vt-primary'
    : 'text-vt-error'

  const inputClass = 'w-full h-[40px] rounded-[9px] border border-[#AEB8C7] px-3 text-sm bg-white text-vt-dark focus:outline-none focus:border-vt-primary focus:ring-4 focus:ring-vt-primary/15'
  const labelClass = 'block text-[13px] font-semibold text-vt-dark mb-1.5'

  return (
    <div>
      <Link href="/admin/contractors" className="inline-flex items-center gap-1.5 text-[13px] text-vt-muted hover:text-vt-dark mb-5 transition-colors">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
        </svg>
        Back to contractors
      </Link>

      {/* Contractor Header */}
      <div className="bg-white rounded-xl border border-vt-border p-6 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[22px] font-semibold text-vt-dark">{contractor.full_name}</h1>
            <p className="text-[14px] text-[#4B5563] mt-1">{contractor.company_name || 'No company name'}</p>
            <p className="text-[13px] text-vt-muted mt-0.5">{contractor.email}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-[12px] text-vt-muted">Subscription</p>
            <p className={`text-[14px] font-bold mt-1 ${subscriptionColor}`}>
              {contractor.subscription_status || 'none'}
            </p>
            <p className="text-[12px] text-vt-muted mt-2.5">Joined {formatDate(contractor.created_at)}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-[22px] pt-[22px] border-t border-[#EEF1F5]">
          <div>
            <p className="text-[12px] text-vt-muted">Total Jobs</p>
            <p className="text-[24px] font-bold text-vt-dark mt-1.5">{contractor.job_count}</p>
          </div>
          <div>
            <p className="text-[12px] text-vt-muted">Variation Value</p>
            <p className="text-[24px] font-bold text-vt-dark mt-1.5">{formatCurrency(contractor.variation_total)}</p>
          </div>
          <div>
            <p className="text-[12px] text-vt-muted">Total Revenue</p>
            <p className="text-[24px] font-bold text-vt-dark mt-1.5">
              {formatCurrency(jobs.reduce((sum, j) => sum + j.original_value, 0) + contractor.variation_total)}
            </p>
          </div>
        </div>
      </div>

      <h2 className="text-[17px] font-semibold text-vt-dark mb-[14px]">Activity &amp; Jobs</h2>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-vt-border p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_200px_200px] gap-4">
          <div>
            <label className={labelClass}>Search jobs &amp; events</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search…"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>From Date</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>To Date</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Events Timeline */}
      <div className="flex flex-col gap-2">
        {events.map(event => (
          <div key={`${event.type}-${event.id}`} className="bg-white rounded-[10px] border border-vt-border p-[14px_16px]">
            <div className="flex items-start gap-[11px]">
              <span className={`w-2 h-2 rounded-full mt-[5px] flex-shrink-0 ${event.type === 'signature' ? 'bg-[#0EA65C]' : 'bg-vt-primary'}`} />
              <div>
                <p className="text-[14px] font-semibold text-vt-dark">{event.title}</p>
                <p className="text-[13px] text-[#4B5563] mt-0.5">{event.detail}</p>
                <p className="text-[12px] text-vt-muted mt-1.5">{formatDate(event.date)}</p>
              </div>
            </div>
          </div>
        ))}

        {!events.length && (
          <div className="text-center py-12 text-vt-muted">
            <p>No activity found</p>
          </div>
        )}
      </div>
    </div>
  )
}
