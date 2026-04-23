'use client'

import { Download } from 'lucide-react'

export default function ExportInvoiceButton({ jobId, jobName }: { jobId: string; jobName: string }) {
  return (
    <a
      href={`/api/pdf/invoice/${jobId}`}
      download={`invoice-${jobName.slice(0, 20)}.pdf`}
      className="flex items-center gap-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors"
    >
      <Download className="w-4 h-4" />
      Export invoice
    </a>
  )
}
