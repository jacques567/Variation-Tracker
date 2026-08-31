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
      <h1 className="text-[22px] font-semibold text-vt-dark mb-[22px]">Dashboard</h1>

      {/* Metrics Grid — 5 columns */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-[14px] mb-6">
        <div className="bg-white rounded-xl border border-vt-border p-[18px]">
          <p className="text-[13px] text-vt-muted">Total Contractors</p>
          <p className="text-[26px] font-bold text-vt-dark mt-2">{contractorCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-vt-border p-[18px]">
          <p className="text-[13px] text-vt-muted">Active Subscriptions</p>
          <p className="text-[26px] font-bold text-vt-success mt-2">{activeSubscriptions}</p>
        </div>
        <div className="bg-white rounded-xl border border-vt-border p-[18px]">
          <p className="text-[13px] text-vt-muted">Total Jobs</p>
          <p className="text-[26px] font-bold text-vt-dark mt-2">{totalJobs}</p>
        </div>
        <div className="bg-white rounded-xl border border-vt-border p-[18px]">
          <p className="text-[13px] text-vt-muted">Signed Variations</p>
          <p className="text-[26px] font-bold text-vt-primary mt-2">{signedVariations.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-vt-border p-[18px]">
          <p className="text-[13px] text-vt-muted">Pending Signatures</p>
          <p className="text-[26px] font-bold text-[#B45309] mt-2">{pendingVariations.length}</p>
        </div>
      </div>

      {/* Three-box layout: Recently Created Jobs, Pending Signatures, Recently Signed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Jobs */}
        <div className="bg-white rounded-xl border border-vt-border p-[18px]">
          <h2 className="text-[14px] font-semibold text-vt-dark mb-[14px]">Recently Created Jobs</h2>
          <div className="flex flex-col gap-2">
            {recentJobs.map(job => (
              <Link
                key={job.id}
                href={`/admin/contractors/${job.contractor_id}`}
                className="block px-3 py-[11px] bg-[#F7F9FB] rounded-[9px] hover:bg-[#E5EEFA] transition-colors"
              >
                <p className="text-[13px] font-semibold text-vt-dark">{job.job_name}</p>
                <p className="text-[12px] text-vt-muted mt-0.5">
                  {contractorById.get(job.contractor_id)} · {formatDate(job.created_at)}
                </p>
              </Link>
            ))}
            {recentJobs.length === 0 && (
              <p className="text-sm text-vt-muted">No jobs yet</p>
            )}
          </div>
        </div>

        {/* Pending Signatures */}
        <div className="bg-white rounded-xl border border-vt-border p-[18px]">
          <h2 className="text-[14px] font-semibold text-vt-dark mb-[14px]">Pending Signatures ({pendingVariations.length})</h2>
          <div className="flex flex-col gap-2">
            {pendingVariations.slice(0, 5).map(variation => {
              const job = jobById.get(variation.job_id)
              const contractor = job ? contractorById.get(job.contractor_id) : null
              return (
                <Link
                  key={variation.id}
                  href={`/admin/contractors/${job?.contractor_id}`}
                  className="block px-3 py-[11px] bg-[#FFFBEB] border border-[#FDE68A] rounded-[9px] hover:bg-[#FEF3C7] transition-colors"
                >
                  <p className="text-[13px] font-semibold text-vt-dark">{variation.description || job?.job_name}</p>
                  <p className="text-[12px] text-vt-muted mt-0.5">
                    {contractor} · {formatCurrency(variation.cost)}
                  </p>
                </Link>
              )
            })}
            {pendingVariations.length === 0 && (
              <p className="text-sm text-vt-muted">No pending signatures</p>
            )}
          </div>
        </div>

        {/* Recent Signatures */}
        <div className="bg-white rounded-xl border border-vt-border p-[18px]">
          <h2 className="text-[14px] font-semibold text-vt-dark mb-[14px]">Recently Signed</h2>
          <div className="flex flex-col gap-2">
            {recentSignatures.map(sig => {
              const variation = variationById.get(sig.variation_id)
              const job = variation ? jobById.get(variation.job_id) : null
              return (
                <div
                  key={sig.id}
                  className="px-3 py-[11px] bg-[#F7F9FB] rounded-[9px]"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-vt-dark">
                        {job?.job_name || 'Unknown Job'}
                      </p>
                      <p className="text-[12px] text-vt-muted mt-0.5">
                        Signed by {sig.client_name} · {formatDate(sig.signed_at)}
                      </p>
                    </div>
                    <SignatureModal signature={sig} variation={variation} />
                  </div>
                </div>
              )
            })}
            {recentSignatures.length === 0 && (
              <p className="text-sm text-vt-muted">No signatures yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
