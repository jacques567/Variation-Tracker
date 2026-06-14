import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate } from '@/lib/utils'
import SignatureModal from '@/components/admin/SignatureModal'

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

  const { data: draftVariations } = await supabase
    .from('variations')
    .select('*')
    .eq('status', 'draft')

  const draftCount = draftVariations?.length || 0

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

  const metricCardStyle = {
    background: 'var(--color-background-secondary)',
    border: `1px solid var(--color-border-light)`,
    padding: 'var(--spacing-lg)',
  }

  const metricLabelStyle = {
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-text-secondary)',
    marginBottom: 'var(--spacing-sm)',
  }

  const metricValueStyle = {
    fontSize: '2rem',
    fontWeight: 'var(--font-weight-bold)',
    marginTop: 'var(--spacing-sm)',
  }

  const listItemStyle = {
    padding: 'var(--spacing-md)',
    background: 'var(--color-background-primary)',
    border: `1px solid var(--color-border-light)`,
    cursor: 'pointer',
    transition: 'all var(--transition-fast)',
    textDecoration: 'none',
    color: 'inherit',
    display: 'block',
  }

  return (
    <div>
      <h1 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-bold)', marginBottom: 'var(--spacing-lg)' }}>
        Dashboard
      </h1>

      {/* Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-2xl)' }}>
        <div style={metricCardStyle}>
          <p style={metricLabelStyle}>Total Contractors</p>
          <p style={{ ...metricValueStyle, color: 'var(--color-text-primary)' }}>{contractorCount || 0}</p>
        </div>
        <div style={metricCardStyle}>
          <p style={metricLabelStyle}>Active Subscriptions</p>
          <p style={{ ...metricValueStyle, color: 'var(--color-primary)' }}>{activeSubscriptions}</p>
        </div>
        <div style={metricCardStyle}>
          <p style={metricLabelStyle}>Total Jobs</p>
          <p style={{ ...metricValueStyle, color: 'var(--color-text-primary)' }}>{totalJobs || 0}</p>
        </div>
        <div style={metricCardStyle}>
          <p style={metricLabelStyle}>Signed Variations</p>
          <p style={{ ...metricValueStyle, color: 'var(--color-primary)' }}>{signedCount}</p>
        </div>
        <div style={metricCardStyle}>
          <p style={metricLabelStyle}>Pending Signatures</p>
          <p style={{ ...metricValueStyle, color: 'var(--color-primary)' }}>{draftCount}</p>
        </div>
      </div>

      {/* Pending Signatures */}
      {draftCount > 0 && (
        <div style={{ background: 'var(--color-background-secondary)', border: `1px solid var(--color-border-light)`, padding: 'var(--spacing-lg)', marginBottom: 'var(--spacing-lg)' }}>
          <h2 style={{ fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)', marginBottom: 'var(--spacing-md)' }}>
            Pending Signatures ({draftCount})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
            {draftVariations?.map(variation => {
              const job = jobById.get(variation.job_id)
              const contractor = job ? contractorById.get(job.contractor_id) : null
              return (
                <Link
                  key={variation.id}
                  href={`/admin/contractors/${job?.contractor_id}`}
                  style={listItemStyle}
                >
                  <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-primary)' }}>
                    {variation.description || job?.job_name}
                  </p>
                  <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginTop: 'var(--spacing-xs)' }}>
                    {contractor} · {formatCurrency(variation.cost)}
                  </p>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--spacing-lg)' }}>
        {/* Recent Jobs */}
        <div style={{ background: 'var(--color-background-secondary)', border: `1px solid var(--color-border-light)`, padding: 'var(--spacing-lg)' }}>
          <h2 style={{ fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)', marginBottom: 'var(--spacing-md)' }}>
            Recently Created Jobs
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
            {recentJobs?.map(job => (
              <Link
                key={job.id}
                href={`/admin/contractors/${job.contractor_id}`}
                style={listItemStyle}
              >
                <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-primary)' }}>
                  {job.job_name}
                </p>
                <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginTop: 'var(--spacing-xs)' }}>
                  {contractorById.get(job.contractor_id)} · {formatDate(job.created_at)}
                </p>
              </Link>
            ))}
            {!recentJobs?.length && (
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>No jobs yet</p>
            )}
          </div>
        </div>

        {/* Recent Signatures */}
        <div style={{ background: 'var(--color-background-secondary)', border: `1px solid var(--color-border-light)`, padding: 'var(--spacing-lg)' }}>
          <h2 style={{ fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)', marginBottom: 'var(--spacing-md)' }}>
            Recently Signed
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
            {recentSignatures?.map(sig => {
              const variation = variationById.get(sig.variation_id)
              const job = variation ? jobById.get(variation.job_id) : null
              return (
                <div
                  key={sig.id}
                  style={{
                    padding: 'var(--spacing-md)',
                    background: 'var(--color-background-primary)',
                    border: `1px solid var(--color-border-light)`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: 'var(--spacing-md)',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-primary)' }}>
                      {job?.job_name || 'Unknown Job'}
                    </p>
                    <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginTop: 'var(--spacing-xs)' }}>
                      Signed by {sig.client_name} · {formatDate(sig.signed_at)}
                    </p>
                  </div>
                  <SignatureModal signature={sig} variation={variation} />
                </div>
              )
            })}
            {!recentSignatures?.length && (
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>No signatures yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
