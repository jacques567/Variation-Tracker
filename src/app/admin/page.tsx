import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate } from '@/lib/utils'

export default async function AdminDashboard() {
  const supabase = await createClient()

  // Fetch metrics
  const { count: contractorCount } = await supabase
    .from('contractors')
    .select('*', { count: 'exact' })

  const { data: contractors } = await supabase
    .from('contractors')
    .select('subscription_status')

  const activeSubscriptions = contractors?.filter(
    c => c.subscription_status === 'active' || c.subscription_status === 'trialing'
  ).length || 0

  const { count: totalJobs } = await supabase
    .from('jobs')
    .select('*', { count: 'exact' })

  const { data: signedVariations } = await supabase
    .from('variations')
    .select('*')
    .eq('status', 'signed')

  const signedCount = signedVariations?.length || 0

  // Fetch recent jobs with contractor details
  const { data: recentJobs } = await supabase
    .from('jobs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)

  // Fetch recent signatures with variation details
  const { data: recentSignatures } = await supabase
    .from('signatures')
    .select('*')
    .order('signed_at', { ascending: false })
    .limit(5)

  // Fetch contractors for display
  const { data: contractorsMap } = await supabase
    .from('contractors')
    .select('id, full_name')

  const contractorById = new Map(contractorsMap?.map(c => [c.id, c.full_name]) || [])

  // Fetch variations and jobs for signatures
  const { data: variationsMap } = await supabase
    .from('variations')
    .select('*')

  const variationById = new Map(variationsMap?.map(v => [v.id, v]) || [])

  const { data: jobsMap } = await supabase
    .from('jobs')
    .select('*')

  const jobById = new Map(jobsMap?.map(j => [j.id, j]) || [])

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Dashboard</h1>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Total Contractors</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{contractorCount || 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Active Subscriptions</p>
          <p className="text-3xl font-bold text-green-600 mt-2">{activeSubscriptions}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Total Jobs</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{totalJobs || 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Signed Variations</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">{signedCount}</p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Jobs */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Recently Created Jobs</h2>
          <div className="space-y-3">
            {recentJobs?.map(job => (
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
            {!recentJobs?.length && (
              <p className="text-sm text-gray-500">No jobs yet</p>
            )}
          </div>
        </div>

        {/* Recent Signatures */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Recently Signed</h2>
          <div className="space-y-3">
            {recentSignatures?.map(sig => {
              const variation = variationById.get(sig.variation_id)
              const job = variation ? jobById.get(variation.job_id) : null
              return (
                <Link
                  key={sig.id}
                  href={`/admin/contractors/${job?.contractor_id}`}
                  className="block p-3 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <p className="text-sm font-medium text-gray-900">
                    {job?.job_name || 'Unknown Job'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Signed by {sig.client_name} · {formatDate(sig.signed_at)}
                  </p>
                </Link>
              )
            })}
            {!recentSignatures?.length && (
              <p className="text-sm text-gray-500">No signatures yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
