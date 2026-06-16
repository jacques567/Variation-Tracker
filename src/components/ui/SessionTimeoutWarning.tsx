'use client'

import { AlertCircle } from 'lucide-react'

interface SessionTimeoutWarningProps {
  isOpen: boolean
  timeRemaining: number
  onStayActive: () => void
  onLogout: () => void
}

export default function SessionTimeoutWarning({
  isOpen,
  timeRemaining,
  onStayActive,
  onLogout,
}: SessionTimeoutWarningProps) {
  if (!isOpen) return null

  const minutes = Math.floor(timeRemaining / 60)
  const seconds = timeRemaining % 60

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm mx-4">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="w-6 h-6 text-amber-600" />
          <h2 className="text-lg font-semibold text-gray-900">
            Session Expiring Soon
          </h2>
        </div>

        <p className="text-gray-600 mb-4">
          Your session will expire due to inactivity in{' '}
          <span className="font-semibold">
            {minutes}:{seconds.toString().padStart(2, '0')}
          </span>
          . Click below to stay active or you&apos;ll be logged out.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onLogout}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
          >
            Log Out
          </button>
          <button
            onClick={onStayActive}
            className="flex-1 px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
          >
            Stay Active
          </button>
        </div>
      </div>
    </div>
  )
}
