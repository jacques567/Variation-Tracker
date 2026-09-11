import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import VariationRow from '@/components/variations/VariationRow'
import ExportInvoiceButton from '@/components/variations/ExportInvoiceButton'
import VariationsLiveUpdater from '@/components/variations/VariationsLiveUpdater'
import type { Variation, Signature } from '@/types'
import ClientEmailEdit from '@/components/jobs/ClientEmailEdit'

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: job } = await supabase
    .from('jobs')
    .select('*, variations(*, signature:signatures(*))')
    .eq('id', id)
    .eq('contractor_id', user.id)
    .single()

  if (!job) notFound()

  const { data: contractor } = await supabase
    .from('contractors')
    .select('company_name')
    .eq('id', user.id)
    .single()

  const variations = job.variations ?? []
  const signedTotal = variations.filter((v: { status: string }) => v.status === 'signed').reduce((s: number, v: { cost: number }) => s + v.cost, 0)
  const pendingTotal = variations.filter((v: { status: string }) => v.status === 'pending').reduce((s: number, v: { cost: number }) => s + v.cost, 0)
  const grandTotal = job.original_value + signedTotal

  return (
    <div>
      {/* Flips a variation to Signed the moment the client signs, without a reload */}
      <VariationsLiveUpdater jobId={id} />

      <Link href="/jobs" className="flex items-center gap-1.5 text-sm text-vt-muted hover:text-vt-dark mb-5">
        <ArrowLeft className="w-4 h-4" /> Back to jobs
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-3 mb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-[22px] font-semibold text-vt-dark truncate">{job.job_name}</h1>
            {job.category && (
              <span className="shrink-0 px-2.5 py-[3px] bg-[#E5EEFA] text-vt-primary text-xs font-semibold rounded-md">
                {job.category}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap text-sm text-vt-muted">
            <span className="break-words">{job.client_name}</span>
            <span className="text-[#7C8798]">·</span>
            <ClientEmailEdit jobId={job.id} initialEmail={job.client_email} />
            <span className="text-[#7C8798]">·</span>
            <span className="break-words">{job.address}</span>
          </div>
        </div>
        <ExportInvoiceButton jobId={job.id} jobName={job.job_name} />
      </div>

      {/* Totals */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-vt-border p-4 flex items-baseline justify-between gap-3 sm:block">
          <p className="text-xs text-vt-muted shrink-0">Contract value</p>
          <p className="text-[19px] font-bold text-vt-dark sm:mt-1.5 tabular-nums">{formatCurrency(job.original_value)}</p>
        </div>
        <div className="bg-white rounded-xl border border-vt-border p-4 flex items-baseline justify-between gap-3 sm:block">
          <p className="text-xs text-vt-muted shrink-0">Signed variations</p>
          <p className={`text-[19px] font-bold sm:mt-1.5 tabular-nums ${signedTotal >= 0 ? 'text-vt-success' : 'text-vt-error'}`}>
            {signedTotal >= 0 ? '+' : ''}{formatCurrency(signedTotal)}
          </p>
        </div>
        <div className="bg-vt-primary rounded-xl p-4 flex items-baseline justify-between gap-3 sm:block">
          <p className="text-xs text-[#C7DDF7] shrink-0">Running total</p>
          <p className="text-[19px] font-bold text-white sm:mt-1.5 tabular-nums">{formatCurrency(grandTotal)}</p>
        </div>
      </div>

      {pendingTotal > 0 && (
        <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-[10px] px-4 py-[11px] mb-6 text-[13px] text-[#92400E]">
          {formatCurrency(pendingTotal)} in variations awaiting client sign-off
        </div>
      )}

      {/* Variations */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-vt-dark">Variations</h2>
        <Link
          href={`/jobs/${id}/variations/new`}
          className="flex items-center gap-1.5 text-[13px] font-semibold bg-vt-primary text-white rounded-[10px] px-3.5 py-2 hover:bg-vt-primary-hover transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Add variation
        </Link>
      </div>

      {!variations.length ? (
        <div className="bg-white rounded-xl border border-vt-border p-8 text-center text-vt-muted">
          <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No variations logged yet</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {variations.map((v: Variation & { signature: Signature | null }) => (
            <VariationRow
              key={v.id}
              variation={v}
              jobId={id}
              jobName={job.job_name}
              clientName={job.client_name}
              companyName={contractor?.company_name ?? null}
              address={job.address}
            />
          ))}
        </div>
      )}
    </div>
  )
}
