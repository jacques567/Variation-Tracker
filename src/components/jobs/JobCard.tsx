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
      className="block bg-white rounded-xl border border-gray-200 p-4 hover:border-blue-200 hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-gray-900 truncate">{job.job_name}</h3>
            <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${
              job.status === 'active'
                ? 'bg-green-50 text-green-700'
                : job.status === 'completed'
                ? 'bg-gray-100 text-gray-600'
                : 'bg-yellow-50 text-yellow-700'
            }`}>
              {job.status}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">{job.client_name}</p>
          <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
            <MapPin className="w-3 h-3" /> {job.address}
          </p>
        </div>
        <div className="text-right shrink-0 flex items-center gap-2">
          <div>
            <p className="font-semibold text-gray-900">{formatCurrency(grandTotal)}</p>
            {signedTotal > 0 && (
              <p className="text-xs text-gray-400">
                +{formatCurrency(signedTotal)} vars
              </p>
            )}
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300" />
        </div>
      </div>
    </Link>
  )
}
