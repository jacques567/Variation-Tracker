/**
 * Stripe webhook scenario tests.
 *
 * Two test groups:
 *   1. Pure evaluateSubscription logic — no server, no DB, no Stripe account needed.
 *   2. Webhook API route — needs the dev server running.
 *      Signature construction tests need STRIPE_WEBHOOK_SECRET in .env.local (use
 *      the signing secret from `stripe listen --forward-to localhost:3000/api/webhooks/stripe`).
 *      Tests that only probe rejection behaviour don't need the secret.
 */

import { test, expect } from '@playwright/test'
import { evaluateSubscription } from '../../src/lib/subscription-evaluation'
import Stripe from 'stripe'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function futureDate(daysFromNow: number): string {
  const d = new Date()
  d.setDate(d.getDate() + daysFromNow)
  return d.toISOString()
}

function pastDate(daysAgo: number): string {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString()
}

/** Build a minimal Stripe event payload and its HMAC signature header. */
function buildSignedEvent(
  type: string,
  subscriptionData: Partial<Stripe.Subscription>,
  secret: string
): { body: string; stripeSignature: string } {
  const event = {
    id: `evt_test_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    object: 'event',
    api_version: '2026-04-22',
    created: Math.floor(Date.now() / 1000),
    type,
    livemode: false,
    pending_webhooks: 0,
    request: { id: null, idempotency_key: null },
    data: {
      object: {
        id: subscriptionData.id ?? 'sub_test123',
        object: 'subscription',
        customer: subscriptionData.customer ?? 'cus_test123',
        status: subscriptionData.status ?? 'active',
        ...subscriptionData,
      },
    },
  }

  const body = JSON.stringify(event)
  const timestamp = Math.floor(Date.now() / 1000)
  const signed_payload = `${timestamp}.${body}`
  const crypto = require('crypto') as typeof import('crypto')
  const hmac = crypto
    .createHmac('sha256', secret.replace(/^whsec_/, ''))
    .update(signed_payload)
    .digest('hex')
  const stripeSignature = `t=${timestamp},v1=${hmac}`

  return { body, stripeSignature }
}

// ─── 1. evaluateSubscription — pure logic ────────────────────────────────────

test.describe('evaluateSubscription — pure logic', () => {
  // Active
  test('active subscription is valid', () => {
    const result = evaluateSubscription({
      subscription_status: 'active',
      trial_ends_at: null,
      grace_period_expires_at: null,
    })
    expect(result.isValid).toBe(true)
    expect(result.status).toBe('active')
  })

  // Trialing — valid
  test('trialing with future trial_ends_at is valid', () => {
    const result = evaluateSubscription({
      subscription_status: 'trialing',
      trial_ends_at: futureDate(3),
      grace_period_expires_at: null,
    })
    expect(result.isValid).toBe(true)
    expect(result.status).toBe('trialing')
  })

  // Trialing — expired
  test('trialing with past trial_ends_at is invalid', () => {
    const result = evaluateSubscription({
      subscription_status: 'trialing',
      trial_ends_at: pastDate(1),
      grace_period_expires_at: null,
    })
    expect(result.isValid).toBe(false)
    expect(result.status).toBe('trialing')
    expect(result.reason).toMatch(/trial has ended/i)
  })

  // Trialing — no date (corrupted record)
  test('trialing with null trial_ends_at is invalid', () => {
    const result = evaluateSubscription({
      subscription_status: 'trialing',
      trial_ends_at: null,
      grace_period_expires_at: null,
    })
    expect(result.isValid).toBe(false)
    expect(result.reason).toMatch(/expiry not set/i)
  })

  // past_due — within grace period
  test('past_due within grace period is valid with past_due_grace_period status', () => {
    const result = evaluateSubscription({
      subscription_status: 'past_due',
      trial_ends_at: null,
      grace_period_expires_at: futureDate(5),
    })
    expect(result.isValid).toBe(true)
    expect(result.status).toBe('past_due_grace_period')
  })

  // past_due — grace period expired
  test('past_due with expired grace period is invalid', () => {
    const result = evaluateSubscription({
      subscription_status: 'past_due',
      trial_ends_at: null,
      grace_period_expires_at: pastDate(1),
    })
    expect(result.isValid).toBe(false)
    expect(result.status).toBe('past_due')
    expect(result.reason).toMatch(/overdue/i)
  })

  // past_due — no grace period set (no webhook ran yet or manual status injection)
  test('past_due with null grace_period_expires_at is invalid', () => {
    const result = evaluateSubscription({
      subscription_status: 'past_due',
      trial_ends_at: null,
      grace_period_expires_at: null,
    })
    expect(result.isValid).toBe(false)
    expect(result.status).toBe('past_due')
  })

  // Canceled
  test('canceled subscription is invalid', () => {
    const result = evaluateSubscription({
      subscription_status: 'canceled',
      trial_ends_at: null,
      grace_period_expires_at: null,
    })
    expect(result.isValid).toBe(false)
    expect(result.status).toBe('canceled')
    expect(result.reason).toMatch(/cancelled/i)
  })

  // None (no subscription)
  test('none status is invalid', () => {
    const result = evaluateSubscription({
      subscription_status: 'none',
      trial_ends_at: null,
      grace_period_expires_at: null,
    })
    expect(result.isValid).toBe(false)
    expect(result.reason).toMatch(/no subscription/i)
  })

  // null contractor
  test('null contractor is invalid', () => {
    const result = evaluateSubscription(null)
    expect(result.isValid).toBe(false)
    expect(result.reason).toMatch(/not found/i)
  })

  // incomplete
  test('incomplete subscription is invalid', () => {
    const result = evaluateSubscription({
      subscription_status: 'incomplete',
      trial_ends_at: null,
      grace_period_expires_at: null,
    })
    expect(result.isValid).toBe(false)
    expect(result.reason).toMatch(/incomplete/i)
  })
})

// ─── 2. Webhook API route ─────────────────────────────────────────────────────

test.describe('POST /api/webhooks/stripe', () => {
  const WEBHOOK_URL = '/api/webhooks/stripe'

  // ── Signature rejection ────────────────────────────────────────────────────

  test('returns 400 when stripe-signature header is missing', async ({ request }) => {
    const response = await request.post(WEBHOOK_URL, {
      data: JSON.stringify({ id: 'evt_test', type: 'customer.subscription.updated' }),
      headers: { 'Content-Type': 'application/json' },
    })
    expect(response.status()).toBe(400)
    const body = await response.json()
    expect(body.error).toBeDefined()
  })

  test('returns 400 when signature is invalid', async ({ request }) => {
    const response = await request.post(WEBHOOK_URL, {
      data: JSON.stringify({ id: 'evt_test', type: 'customer.subscription.updated' }),
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 't=1234567890,v1=badhash',
      },
    })
    expect(response.status()).toBe(400)
    const body = await response.json()
    expect(body.error).toBeDefined()
  })

  // ── Signed event scenarios (require STRIPE_WEBHOOK_SECRET in .env.local) ──

  test.describe('signed event scenarios', () => {
    const secret = process.env.STRIPE_WEBHOOK_SECRET

    test.skip(() => !secret, 'Requires STRIPE_WEBHOOK_SECRET — run stripe listen first')

    test('customer.subscription.deleted → 200 received:true', async ({ request }) => {
      const { body, stripeSignature } = buildSignedEvent(
        'customer.subscription.deleted',
        { customer: 'cus_audit_test', status: 'canceled' as Stripe.Subscription.Status },
        secret!
      )

      const response = await request.post(WEBHOOK_URL, {
        data: body,
        headers: {
          'Content-Type': 'application/json',
          'stripe-signature': stripeSignature,
        },
      })

      expect(response.status()).toBe(200)
      const json = await response.json()
      expect(json.received).toBe(true)
    })

    test('customer.subscription.updated with past_due → 200 received:true', async ({ request }) => {
      const { body, stripeSignature } = buildSignedEvent(
        'customer.subscription.updated',
        { customer: 'cus_audit_test', status: 'past_due' as Stripe.Subscription.Status },
        secret!
      )

      const response = await request.post(WEBHOOK_URL, {
        data: body,
        headers: {
          'Content-Type': 'application/json',
          'stripe-signature': stripeSignature,
        },
      })

      expect(response.status()).toBe(200)
      const json = await response.json()
      expect(json.received).toBe(true)
    })

    test('customer.subscription.updated with active → 200 received:true', async ({ request }) => {
      const { body, stripeSignature } = buildSignedEvent(
        'customer.subscription.updated',
        { customer: 'cus_audit_test', status: 'active' as Stripe.Subscription.Status },
        secret!
      )

      const response = await request.post(WEBHOOK_URL, {
        data: body,
        headers: {
          'Content-Type': 'application/json',
          'stripe-signature': stripeSignature,
        },
      })

      expect(response.status()).toBe(200)
      const json = await response.json()
      expect(json.received).toBe(true)
    })

    test('unknown event type → 200 received:true (logged but not processed)', async ({ request }) => {
      const { body, stripeSignature } = buildSignedEvent(
        'customer.subscription.trial_will_end',
        { customer: 'cus_audit_test', status: 'trialing' as Stripe.Subscription.Status },
        secret!
      )

      const response = await request.post(WEBHOOK_URL, {
        data: body,
        headers: {
          'Content-Type': 'application/json',
          'stripe-signature': stripeSignature,
        },
      })

      expect(response.status()).toBe(200)
      const json = await response.json()
      expect(json.received).toBe(true)
    })
  })
})
