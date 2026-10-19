'use client'

import { useEffect, useRef, useState } from 'react'
import { Download, FileText } from 'lucide-react'

export default function ExportInvoiceButton({ jobId, jobName }: { jobId: string; jobName: string }) {
  const filename = `invoice-${jobName.slice(0, 20)}.pdf`
  const [toastVisible, setToastVisible] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => () => clearTimeout(timer.current), [])

  // The anchor's own download still runs; this only confirms it to the user,
  // since browsers often show nothing until the PDF has finished generating.
  function showToast() {
    clearTimeout(timer.current)
    setToastVisible(true)
    timer.current = setTimeout(() => setToastVisible(false), 3500)
  }

  return (
    <>
      <a
        href={`/api/pdf/invoice/${jobId}`}
        download={filename}
        onClick={showToast}
        className="flex items-center gap-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors"
      >
        <Download className="w-4 h-4" />
        Export invoice
      </a>
      {toastVisible && (
        <div className="fixed inset-x-0 bottom-6 z-50 flex justify-center px-4 pointer-events-none">
          <div
            role="status"
            className="vt-rise flex items-center gap-2 bg-vt-dark text-white text-sm rounded-[10px] px-4 py-3 shadow-lg max-w-full"
          >
            <FileText className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span className="truncate">Downloading {filename}</span>
          </div>
        </div>
      )}
    </>
  )
}
