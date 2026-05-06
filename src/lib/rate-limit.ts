const windows = new Map<string, number[]>()

// Prune keys older than 2x the window to bound memory growth
const PRUNE_MULTIPLIER = 2

export function checkRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now()
  const windowStart = now - windowMs

  const timestamps = (windows.get(key) ?? []).filter(t => t > windowStart)

  if (timestamps.length >= maxRequests) {
    windows.set(key, timestamps)
    return false
  }

  timestamps.push(now)
  windows.set(key, timestamps)

  // Periodic cleanup: remove keys with no recent activity
  if (Math.random() < 0.01) {
    const pruneThreshold = now - windowMs * PRUNE_MULTIPLIER
    for (const [k, ts] of windows.entries()) {
      if (ts.every(t => t < pruneThreshold)) windows.delete(k)
    }
  }

  return true
}
