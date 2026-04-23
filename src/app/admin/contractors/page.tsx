'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'
import type { Contractor } from '@/types'

interface ContractorWithStats extends Contractor {
  job_count: number
}

export default function ContractorsPage() {
  const [contractors, setContractors] = useState<ContractorWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    loadContractors()
  }, [])

  async function loadContractors() {
    try {
      setLoading(true)
      const supabase = createClient()

      // Fetch all contractors
      const { data: allContractors } = await supabase
        .from('contractors')
        .select('*')
        .order('created_at', { ascending: false })

      if (!allContractors) {
        setContractors([])
        return
      }

      // Count jobs for each contractor
      const { data: jobs } = await supabase
        .from('jobs')
        .select('contractor_id')

      const jobCounts = new Map<string, number>()
      jobs?.forEach(job => {
        jobCounts.set(job.contractor_id, (jobCounts.get(job.contractor_id) || 0) + 1)
      })

      const contractorsWithStats = allContractors.map(c => ({
        ...c,
        job_count: jobCounts.get(c.id) || 0,
      }))

      setContractors(contractorsWithStats)
    } finally {
      setLoading(false)
    }
  }

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

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Contractors</h1>

      {/* Search & Filter */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, or company..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subscription Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="trialing">Trialing</option>
              <option value="past_due">Past Due</option>
              <option value="canceled">Canceled</option>
            </select>
          </div>
          <div className="flex items-end">
            <p className="text-sm text-gray-600">
              Showing {filtered.length} of {contractors.length} contractors
            </p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left font-semibold text-gray-900">Name</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-900">Email</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-900">Company</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-900">Status</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-900">Jobs</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-900">Joined</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-900">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filtered.map(contractor => (
              <tr key={contractor.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-gray-900 font-medium">
                  {contractor.full_name || '—'}
                </td>
                <td className="px-6 py-4 text-gray-600">{contractor.email}</td>
                <td className="px-6 py-4 text-gray-600">
                  {contractor.company_name || '—'}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    contractor.subscription_status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : contractor.subscription_status === 'trialing'
                      ? 'bg-blue-100 text-blue-700'
                      : contractor.subscription_status === 'past_due'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {contractor.subscription_status || 'none'}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-900">{contractor.job_count}</td>
                <td className="px-6 py-4 text-gray-600 text-xs">
                  {formatDate(contractor.created_at)}
                </td>
                <td className="px-6 py-4">
                  <Link
                    href={`/admin/contractors/${contractor.id}`}
                    className="text-blue-600 hover:text-blue-700 font-medium text-xs"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!filtered.length && (
          <div className="p-12 text-center text-gray-500">
            <p>No contractors found</p>
          </div>
        )}
      </div>
    </div>
  )
}
