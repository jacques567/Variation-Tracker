import Tokens from 'csrf'

const tokens = new Tokens()

// Track used tokens to prevent reuse (one-time use enforcement)
// In production, use Redis or database for persistence across restarts
const usedTokens = new Map<string, number>()

function getSecret(): string {
  const secret = process.env.CSRF_SECRET
  if (!secret) {
    throw new Error('CSRF_SECRET environment variable is required. Set it in your .env.local file.')
  }
  return secret
}

export async function generateCsrfToken(): Promise<string> {
  const token = tokens.create(getSecret())
  // Token expires in 1 hour
  usedTokens.set(token, Date.now() + 3600000)
  return token
}

export async function verifyCsrfToken(token: string): Promise<boolean> {
  // Check if token has been used before (prevent replay)
  if (!usedTokens.has(token)) {
    return false
  }

  const expiryTime = usedTokens.get(token)!

  // Check if token has expired
  if (Date.now() > expiryTime) {
    usedTokens.delete(token)
    return false
  }

  // Verify signature
  const isValid = tokens.verify(getSecret(), token)

  // Mark token as consumed (one-time use)
  if (isValid) {
    usedTokens.delete(token)
  }

  return isValid
}

// Cleanup expired tokens every 10 minutes
setInterval(() => {
  const now = Date.now()
  for (const [token, expiryTime] of usedTokens.entries()) {
    if (now > expiryTime) {
      usedTokens.delete(token)
    }
  }
}, 600000)
