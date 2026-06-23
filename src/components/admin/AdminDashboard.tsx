'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate } from '@/lib/utils'
import SignatureModal from './SignatureModal'
import type { Database } from '@/types/database'

type Job = Database['public']['Tables']['jobs']['Row']
type Variation = Database['public']['Tables']['variations']['Row']
type Signature = Database['public']['Tables']['signatures']['Row']
type Contractor = Database['public']['Tables']['contractors']['Row']

interface AdminDashboardProps {
  initialContractors: Contractor[]
  initialJobs: Job[]
  initialVariations: Variation[]
  initialSignatures: Signature[]
}

export default function AdminDashboard({
  initialContractors,
  initialJobs,
  initialVariations,
  initialSignatures,
}: AdminDashboardProps) {
  const [contractors, setContractors] = useState(initialContractors)
  const [jobs, setJobs] = useState(initialJobs)
  const [variations, setVariations] = useState(initialVariations)
  const [signatures, setSignatures] = useState(initialSignatures)

  useEffect(() => {
    const supabase = createClient()

    // Subscribe to variations changes
    const variationsSubscription = supabase
      .channel('variations')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'variations' },
        (payload: any) => {
          if (payload.eventType === 'INSERT') {
            setVariations(prev => [payload.new as Variation, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setVariations(prev =>
              prev.map(v => v.id === (payload.new as Variation).id ? (payload.new as Variation) : v)
            )
          } else if (payload.eventType === 'DELETE') {
            setVariations(prev => prev.filter(v => v.id !== (payload.old as Variation).id))
          }
        }
      )
      .subscribe()

    // Subscribe to jobs changes
    const jobsSubscription = supabase
      .channel('jobs')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'jobs' },
        (payload: any) => {
          if (payload.eventType === 'INSERT') {
            setJobs(prev => [payload.new as Job, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setJobs(prev =>
              prev.map(j => j.id === (payload.new as Job).id ? (payload.new as Job) : j)
            )
          } else if (payload.eventType === 'DELETE') {
            setJobs(prev => prev.filter(j => j.id !== (payload.old as Job).id))
          }
        }
      )
      .subscribe()

    // Subscribe to signatures changes
    const signaturesSubscription = supabase
      .channel('signatures')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'signatures' },
        (payload: any) => {
          if (payload.eventType === 'INSERT') {
            setSignatures(prev => [payload.new as Signature, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setSignatures(prev =>
              prev.map(s => s.id === (payload.new as Signature).id ? (payload.new as Signature) : s)
            )
          } else if (payload.eventType === 'DELETE') {
            setSignatures(prev => prev.filter(s => s.id !== (payload.old as Signature).id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(variationsSubscription)
      supabase.removeChannel(jobsSubscription)
      supabase.removeChannel(signaturesSubscription)
    }
  }, [])

  // Calculate metrics from current state
  const contractorCount = contractors.length
  const activeSubscriptions = contractors.filter(
    c => c.subscription_status === 'active' || c.subscription_status === 'trialing'
  ).length
  const totalJobs = jobs.length
  const signedVariations = variations.filter(v => v.status === 'signed')
  const pendingVariations = variations.filter(v => v.status === 'draft')

  // Build maps for display
  const contractorById = new Map(contractors.map(c => [c.id, c.full_name]))
  const jobById = new Map(jobs.map(j => [j.id, j]))
  const variationById = new Map(variations.map(v => [v.id, v]))

  // Get recent data
  const recentJobs = jobs.slice(0, 5)
  const recentSignatures = signatures.slice(0, 5)

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Dashboard</h1>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Total Contractors</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{contractorCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Active Subscriptions</p>
          <p className="text-3xl font-bold text-green-600 mt-2">{activeSubscriptions}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Total Jobs</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{totalJobs}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Signed Variations</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">{signedVariations.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Pending Signatures</p>
          <p className="text-3xl font-bold text-amber-600 mt-2">{pendingVariations.length}</p>
        </div>
      </div>

      {/* Three-box layout: Recently Created Jobs, Pending Signatures, Recently Signed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Jobs */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Recently Created Jobs</h2>
          <div className="space-y-3">
            {recentJobs.map(job => (
              <Link
                key={job.id}
                href={`/admin/contractors/${job.contractor_id}`}
                className="block p-3 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <p className="text-sm font-medium text-gray-900">{job.job_name}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {contractorById.get(job.contractor_id)} · {formatDate(job.created_at)}
                </p>
              </Link>
            ))}
            {recentJobs.length === 0 && (
              <p className="text-sm text-gray-500">No jobs yet</p>
            )}
          </div>
        </div>

        {/* Pending Signatures */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Pending Signatures ({pendingVariations.length})</h2>
          <div className="space-y-3">
            {pendingVariations.slice(0, 5).map(variation => {
              const job = jobById.get(variation.job_id)
              const contractor = job ? contractorById.get(job.contractor_id) : null
              return (
                <Link
                  key={variation.id}
                  href={`/admin/contractors/${job?.contractor_id}`}
                  className="block p-3 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors border border-amber-200"
                >
                  <p className="text-sm font-medium text-gray-900">{variation.description || job?.job_name}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {contractor} · {formatCurrency(variation.cost)}
                  </p>
                </Link>
              )
            })}
            {pendingVariations.length === 0 && (
              <p className="text-sm text-gray-500">No pending signatures</p>
            )}
          </div>
        </div>

        {/* Recent Signatures */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Recently Signed</h2>
          <div className="space-y-3">
            {recentSignatures.map(sig => {
              const variation = variationById.get(sig.variation_id)
              const job = variation ? jobById.get(variation.job_id) : null
              return (
                <div
                  key={sig.id}
                  className="p-3 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {job?.job_name || 'Unknown Job'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Signed by {sig.client_name} · {formatDate(sig.signed_at)}
                      </p>
                    </div>
                    <SignatureModal signature={sig} variation={variation} />
                  </div>
                </div>
              )
            })}
            {recentSignatures.length === 0 && (
              <p className="text-sm text-gray-500">No signatures yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
