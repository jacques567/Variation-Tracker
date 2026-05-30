import { kv } from '@vercel/kv'

export async function checkRateLimit(key: string, maxRequests: number, windowMs: number): Promise<boolean> {
  const now = Date.now()
  const windowStart = now - windowMs

  const kvKey = `ratelimit:${key}`
  const timestamps = (await kv.get<number[]>(kvKey)) ?? []
  const recentTimestamps = timestamps.filter(t => t > windowStart)

  if (recentTimestamps.length >= maxRequests) {
    return false
  }

  recentTimestamps.push(now)
  await kv.setex(kvKey, Math.ceil(windowMs / 1000), JSON.stringify(recentTimestamps))

  return true
}
