import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate } from '@/lib/utils'
import VariationRow from '@/components/variations/VariationRow'
import ExportInvoiceButton from '@/components/variations/ExportInvoiceButton'

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

  const variations = job.variations ?? []
  const signedTotal = variations.filter((v: { status: string }) => v.status === 'signed').reduce((s: number, v: { cost: number }) => s + v.cost, 0)
  const pendingTotal = variations.filter((v: { status: string }) => v.status === 'pending').reduce((s: number, v: { cost: number }) => s + v.cost, 0)
  const grandTotal = job.original_value + signedTotal

  return (
    <div>
      <Link href="/jobs" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6">
        <ArrowLeft className="w-4 h-4" /> All jobs
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-gray-900">{job.job_name}</h1>
            {job.category && (
              <span className="px-2.5 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                {job.category}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-0.5">{job.client_name} · {job.address}</p>
        </div>
        <ExportInvoiceButton jobId={job.id} jobName={job.job_name} />
      </div>

      {/* Totals */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Contract value</p>
          <p className="text-lg font-semibold text-gray-900 mt-1">{formatCurrency(job.original_value)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Signed variations</p>
          <p className="text-lg font-semibold text-green-600 mt-1">+{formatCurrency(signedTotal)}</p>
        </div>
        <div className="bg-blue-600 rounded-xl p-4">
          <p className="text-xs text-blue-100">Running total</p>
          <p className="text-lg font-semibold text-white mt-1">{formatCurrency(grandTotal)}</p>
        </div>
      </div>

      {pendingTotal > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-6 text-sm text-amber-800">
          {formatCurrency(pendingTotal)} in variations awaiting client sign-off
        </div>
      )}

      {/* Variations */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-medium text-gray-900">Variations</h2>
        <Link
          href={`/jobs/${id}/variations/new`}
          className="flex items-center gap-1.5 text-sm bg-blue-600 text-white rounded-lg px-3 py-1.5 hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Add variation
        </Link>
      </div>

      {!variations.length ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
          <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No variations logged yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {variations.map((variation: Parameters<typeof VariationRow>[0]['variation']) => (
            <VariationRow key={variation.id} variation={variation} jobId={id} />
          ))}
        </div>
      )}
    </div>
  )
}
