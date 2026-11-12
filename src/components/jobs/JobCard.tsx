import Link from 'next/link'
import { MapPin, ChevronRight } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface JobCardProps {
  job: {
    id: string
    job_name: string
    client_name: string
    address: string
    original_value: number
    status: string
    variations: { id: string; cost: number; status: string }[]
  }
}

export default function JobCard({ job }: JobCardProps) {
  const signedTotal = job.variations
    .filter((v) => v.status === 'signed')
    .reduce((sum, v) => sum + v.cost, 0)

  const grandTotal = job.original_value + signedTotal

  return (
    <Link
      href={`/jobs/${job.id}`}
      className="block bg-white rounded-xl border border-vt-light p-4 shadow-[0_1px_2px_rgba(15,23,32,0.04)] hover:border-vt-primary/30 hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-[15px] font-semibold text-vt-dark truncate">{job.job_name}</h3>
            <span className={`shrink-0 text-xs px-2.5 py-0.5 rounded-full font-semibold ${
              job.status === 'active'
                ? 'bg-vt-success-bg text-vt-success'
                : job.status === 'completed'
                ? 'bg-vt-neutral-bg text-vt-neutral'
                : 'bg-vt-warning-bg text-vt-warning-pill'
            }`}>
              {job.status}
            </span>
          </div>
          <p className="text-sm text-vt-muted mt-0.5">{job.client_name}</p>
          <p className="text-xs text-vt-muted mt-1 flex items-center gap-1">
            <MapPin className="w-[11px] h-[11px]" aria-hidden="true" /> {job.address}
          </p>
        </div>
        <div className="text-right shrink-0 flex items-center gap-2.5">
          <div>
            <p className="text-[15px] font-bold text-vt-dark">{formatCurrency(grandTotal)}</p>
            {signedTotal > 0 && (
              <p className="text-[11px] text-vt-muted mt-0.5">
                +{formatCurrency(signedTotal)} vars
              </p>
            )}
          </div>
          <ChevronRight className="w-4 h-4 text-vt-icon" aria-hidden="true" />
        </div>
      </div>
    </Link>
  )
}
