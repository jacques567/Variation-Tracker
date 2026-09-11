'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'
import type { Contractor } from '@/types'

interface ContractorWithStats extends Contractor {
  job_count: number
  last_login_at: string | null
}

export default function ContractorsPage() {
  const [contractors, setContractors] = useState<ContractorWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  async function loadContractors() {
    try {
      setLoading(true)
      const supabase = createClient()

      // Fetch all contractors with login tracking
      const { data: allContractors } = await supabase
        .from('contractors')
        .select('*')
        .order('last_login_at', { ascending: false, nullsFirst: false })

      if (!allContractors) {
        setContractors([])
        return
      }

      // Count jobs for each contractor
      const { data: jobs } = await supabase
        .from('jobs')
        .select('contractor_id')

      const jobCounts = new Map<string, number>()
      jobs?.forEach((job: { contractor_id: string }) => {
        jobCounts.set(job.contractor_id, (jobCounts.get(job.contractor_id) || 0) + 1)
      })

      const contractorsWithStats = allContractors.map((c: any) => ({
        ...c,
        job_count: jobCounts.get(c.id) || 0,
      }))

      setContractors(contractorsWithStats)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadContractors()
  }, [])

  // Filter and search
  const filtered = useMemo(() => {
    return contractors.filter(c => {
      const matchesSearch =
        c.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.company_name?.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus =
        statusFilter === 'all' ||
        c.subscription_status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [contractors, searchQuery, statusFilter])

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>
  }

  const statusBadge = (status: string | null) => {
    if (status === 'active') return 'text-[11px] px-2.5 py-0.5 rounded-full font-semibold bg-[#ECFDF5] text-vt-success'
    if (status === 'trialing') return 'text-[11px] px-2.5 py-0.5 rounded-full font-semibold bg-[#E5EEFA] text-vt-primary'
    if (status === 'past_due') return 'text-[11px] px-2.5 py-0.5 rounded-full font-semibold bg-[#FEF2F2] text-[#B91C1C]'
    return 'text-[11px] px-2.5 py-0.5 rounded-full font-semibold bg-[#F3F4F6] text-[#4B5563]'
  }

  return (
    <div>
      <h1 className="text-[22px] font-semibold text-vt-dark mb-[22px]">Contractors</h1>

      {/* Search & Filter */}
      <div className="bg-white rounded-xl border border-vt-border p-[18px] mb-4">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_220px_1fr] gap-4 items-end">
          <div>
            <label className="block text-[13px] font-semibold text-vt-dark mb-1.5">Search</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, or company…"
              className="w-full h-[40px] rounded-[9px] border border-[#AEB8C7] px-3 text-sm bg-white text-vt-dark focus:outline-none focus:border-vt-primary focus:ring-4 focus:ring-vt-primary/15"
            />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-vt-dark mb-1.5">Subscription Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full h-[40px] rounded-[9px] border border-[#AEB8C7] px-3 text-sm bg-white text-vt-dark focus:outline-none focus:border-vt-primary focus:ring-4 focus:ring-vt-primary/15"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="trialing">Trialing</option>
              <option value="past_due">Past Due</option>
              <option value="canceled">Canceled</option>
            </select>
          </div>
          <p className="text-[13px] text-vt-muted pb-[9px]">
            Showing {filtered.length} of {contractors.length} contractors
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-vt-border overflow-hidden">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-[#F7F9FB] border-b border-vt-border">
              <th className="px-5 py-3 text-left font-semibold text-vt-dark">Email</th>
              <th className="px-5 py-3 text-left font-semibold text-vt-dark">Company</th>
              <th className="px-5 py-3 text-left font-semibold text-vt-dark">Status</th>
              <th className="px-5 py-3 text-left font-semibold text-vt-dark">Jobs</th>
              <th className="px-5 py-3 text-left font-semibold text-vt-dark">Last Login</th>
              <th className="px-5 py-3 text-left font-semibold text-vt-dark">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((contractor, i) => (
              <tr
                key={contractor.id}
                className={`hover:bg-[#F7F9FB] transition-colors ${i < filtered.length - 1 ? 'border-b border-[#EEF1F5]' : ''}`}
              >
                <td className="px-5 py-[14px] text-vt-dark font-medium">{contractor.email}</td>
                <td className="px-5 py-[14px] text-[#4B5563]">{contractor.company_name || '—'}</td>
                <td className="px-5 py-[14px]">
                  <span className={statusBadge(contractor.subscription_status)}>
                    {contractor.subscription_status || 'none'}
                  </span>
                </td>
                <td className="px-5 py-[14px] text-vt-dark">{contractor.job_count}</td>
                <td className="px-5 py-[14px] text-vt-muted text-[13px]">
                  {contractor.last_login_at ? formatDate(contractor.last_login_at) : 'Never'}
                </td>
                <td className="px-5 py-[14px]">
                  <Link
                    href={`/admin/contractors/${contractor.id}`}
                    className="text-vt-primary font-semibold text-[13px] hover:underline"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!filtered.length && (
          <div className="p-12 text-center text-vt-muted">
            <p>No contractors found</p>
          </div>
        )}
      </div>
    </div>
  )
}
