import Stripe from 'stripe'

let _stripe: Stripe | null = null

/**
 * Returns a lazily-initialised Stripe client.
 * Initialising at module scope causes Next.js to crash during build
 * when STRIPE_SECRET_KEY is not present in the environment.
 */
export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) {
      throw new Error(
        'Missing STRIPE_SECRET_KEY — add it to your Vercel environment variables.'
      )
    }
    _stripe = new Stripe(key, { apiVersion: '2026-03-25.dahlia' })
  }
  return _stripe
}
