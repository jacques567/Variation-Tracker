import { test, expect } from '@playwright/test'

/**
 * Tests for PostcodeLookup component on /jobs/new.
 *
 * Interactive component tests (postcode input → lookup → address assembly)
 * require authenticated state. Those are marked BLOCKED — they need a real
 * Supabase session or a seeded test account, consistent with the rest of
 * this test suite's approach to auth-gated routes.
 *
 * Unauthenticated tests verify the redirect path behaves correctly and
 * that adding PostcodeLookup has not introduced any JS errors.
 */

test.describe('PostcodeLookup — unauthenticated (redirect path)', () => {
  test('/jobs/new redirects to login when unauthenticated', async ({ page }) => {
    await page.goto('/jobs/new')
    await page.waitForLoadState('networkidle')
    expect(page.url()).toMatch(/\/(login)/)
  })

  test('no JS errors on /jobs/new redirect', async ({ page }) => {
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text())
    })

    await page.goto('/jobs/new')
    await page.waitForLoadState('networkidle')

    const criticalErrors = errors.filter(e =>
      e.includes('Cannot read') || e.includes('is not a function') || e.includes('TypeError')
    )
    expect(criticalErrors).toHaveLength(0)
  })

  test('login page renders cleanly after /jobs/new redirect', async ({ page }) => {
    await page.goto('/jobs/new')
    await page.waitForLoadState('networkidle')

    const emailInput = page.locator('input[type="email"]')
    await expect(emailInput).toBeVisible()
  })
})

/**
 * BLOCKED — require authenticated state
 *
 * The following tests are documented here as the intended coverage
 * but cannot run without a Supabase-authenticated session:
 *
 * - shows postcode lookup UI by default (postcode input + Find button visible)
 * - valid postcode → street input + readonly town/county autofill
 * - street + autofill assembles correct address string in formData
 * - invalid postcode (404) → inline "Postcode not found" error
 * - network failure → auto-switch to manual entry mode
 * - "Enter manually" link switches to free-text input
 * - "Use postcode lookup" link switches back from manual mode
 * - Enter key on postcode input triggers Find
 *
 * To unblock: seed a test account in Supabase or implement
 * storageState-based auth fixture consistent with other auth-gated tests.
 */
