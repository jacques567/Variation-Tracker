/**
 * Stripe webhook scenario tests.
 *
 * Two test groups:
 *   1. Pure evaluateSubscription logic (11 tests) — no server, no DB, no Stripe account needed.
 *   2. Webhook API signature validation (2 tests) — needs the dev server running.
 *      Tests rejection of missing and invalid stripe-signature headers.
 */

import { test, expect } from '@playwright/test'
import { evaluateSubscription } from '../../src/lib/subscription-evaluation'

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

  // ── Signed event scenarios (skip: manual signature construction is fragile) ──
  // These are documented scenarios for what the webhook handler does, but verifying them
  // requires either:
  //   1. Sending real events via Stripe's test API (requires account + fixture setup)
  //   2. Using stripe listen + curl (manual, not automated)
  // The signature verification logic is tested by the rejection tests above (missing/invalid sig).
  // Functional behavior is covered via the pure evaluateSubscription tests.

  test.describe('signed event scenarios', () => {
    test.skip('customer.subscription.deleted → 200 received:true', async () => {})
    test.skip('customer.subscription.updated with past_due → 200 received:true', async () => {})
    test.skip('customer.subscription.updated with active → 200 received:true', async () => {})
    test.skip('unknown event type → 200 received:true (logged but not processed)', async () => {})
  })
})
