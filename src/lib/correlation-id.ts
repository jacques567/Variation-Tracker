import { AsyncLocalStorage } from 'async_hooks'
import { randomBytes } from 'crypto'

const correlationIdStore = new AsyncLocalStorage<string>()

export function generateCorrelationId(): string {
  return randomBytes(8).toString('hex')
}

export function setCorrelationId(id: string): void {
  correlationIdStore.enterWith(id)
}

export function getCorrelationId(): string | undefined {
  return correlationIdStore.getStore()
}

