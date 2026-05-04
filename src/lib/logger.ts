import { getCorrelationId } from '@/lib/correlation-id'

function formatLog(level: string, message: string, data?: unknown): string {
  const correlationId = getCorrelationId()
  const timestamp = new Date().toISOString()
  const id = correlationId ? ` [${correlationId}]` : ''
  const dataStr = data ? ` ${JSON.stringify(data)}` : ''
  return `[${timestamp}] ${level}${id}: ${message}${dataStr}`
}

export const logger = {
  log: (message: string, data?: unknown) => {
    console.log(formatLog('INFO', message, data))
  },
  error: (message: string, data?: unknown) => {
    console.error(formatLog('ERROR', message, data))
  },
  warn: (message: string, data?: unknown) => {
    console.warn(formatLog('WARN', message, data))
  },
  debug: (message: string, data?: unknown) => {
    console.debug(formatLog('DEBUG', message, data))
  },
}
