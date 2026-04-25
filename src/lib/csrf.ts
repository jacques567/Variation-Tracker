import Tokens from 'csrf'

const tokens = new Tokens()

function getSecret(): string {
  const secret = process.env.CSRF_SECRET
  if (!secret) {
    throw new Error('CSRF_SECRET environment variable is required. Set it in your .env.local file.')
  }
  return secret
}

export async function generateCsrfToken(): Promise<string> {
  return tokens.create(getSecret())
}

export async function verifyCsrfToken(token: string): Promise<boolean> {
  return tokens.verify(getSecret(), token)
}
