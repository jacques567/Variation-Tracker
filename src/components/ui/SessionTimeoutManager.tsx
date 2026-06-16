'use client'

import { useSessionTimeout } from '@/hooks/useSessionTimeout'
import SessionTimeoutWarning from './SessionTimeoutWarning'

export default function SessionTimeoutManager() {
  const { showWarning, timeRemaining, handleStayActive, handleLogout } =
    useSessionTimeout()

  return (
    <SessionTimeoutWarning
      isOpen={showWarning}
      timeRemaining={timeRemaining}
      onStayActive={handleStayActive}
      onLogout={handleLogout}
    />
  )
}
