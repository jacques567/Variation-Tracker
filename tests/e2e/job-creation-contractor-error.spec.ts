import { test, expect } from '@playwright/test'

/**
 * Regression test for the "Contractor not found" misdiagnosis bug.
 *
 * jobs/new/page.tsx used to discard the Supabase error when fetching the
 * contractor's subscription row, so a genuine query failure looked
 * identical to "no contractor row found" — the same message shown for
 * orphaned accounts missing a contractors row entirely. This test forces
 * the contractor lookup to fail and asserts the distinct error message
 * is shown instead of the misleading "Contractor not found" text.
 */

test.describe('Job creation — contractor lookup failure', () => {
  const timestamp = Date.now()
  const email = `test-contractor-error-${timestamp}@example.com`
  const password = 'TestPassword123!'

  test('shows a distinct error when the contractor lookup fails', async ({ page }) => {
    const baseURL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000'

    // Signup establishes a session cookie directly (data.session), so there's
    // no need to log in separately afterwards.
    const signupRes = await page.context().request.post(`${baseURL}/api/auth/signup`, {
      data: { email, password, full_name: 'Contractor Error Test' },
    })
    expect(signupRes.ok()).toBeTruthy()

    // Force the contractor subscription lookup to fail once we're past
    // login, so we exercise the new error branch rather than the happy path.
    await page.route('**/rest/v1/contractors*', route => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'simulated contractor lookup failure' }),
        })
      }
      return route.continue()
    })

    await page.goto('/jobs/new')
    await page.waitForLoadState('networkidle')

    await page.locator('input[name="job_name"]').fill('Test Job')
    await page.getByText('or enter address manually').click()
    await page.getByPlaceholder('14 Maple Street, Manchester, M1 1AB').fill('14 Maple Street, Manchester, M1 1AB')
    await page.locator('input[name="original_value"]').fill('5000')
    await page.locator('input[name="client_name"]').fill('Test Client')
    await page.locator('input[name="client_email"]').fill('client@example.com')

    await page.locator('button[type="submit"]').click()

    const errorBanner = page.locator('p.bg-red-50', { hasText: 'Unable to verify your account right now' })
    await expect(errorBanner).toBeVisible()
    await expect(page.locator('p.bg-red-50')).not.toContainText('Contractor not found')
  })
})
