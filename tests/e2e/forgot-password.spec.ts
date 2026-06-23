import { test, expect } from '@playwright/test'

test.describe('Forgot password flow', () => {
  // --- /forgot-password page ---

  test('forgot-password page loads for unauthenticated users', async ({ page }) => {
    await page.goto('/forgot-password')
    await expect(page.locator('h2:has-text("Reset your password")')).toBeVisible()
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('forgot-password page has back to sign in link', async ({ page }) => {
    await page.goto('/forgot-password')
    await expect(page.locator('a:has-text("Back to sign in")')).toBeVisible()
  })

  test('forgot-password back to sign in navigates to login', async ({ page }) => {
    await page.goto('/forgot-password')
    await page.locator('a:has-text("Back to sign in")').click()
    await expect(page).toHaveURL('/login')
  })

  test('forgot-password submit button is disabled during loading', async ({ page }) => {
    await page.goto('/forgot-password')
    await page.fill('input[type="email"]', 'test@example.com')

    // Intercept the API call to delay it so we can check loading state
    await page.route('/api/auth/forgot-password', async route => {
      await new Promise(r => setTimeout(r, 500))
      await route.fulfill({ status: 200, body: JSON.stringify({ ok: true }) })
    })

    await page.locator('button[type="submit"]').click()
    await expect(page.locator('button[type="submit"]')).toBeDisabled()
    await expect(page.locator('button[type="submit"]')).toContainText('Sending...')
  })

  test('forgot-password shows confirmation state after submit', async ({ page }) => {
    await page.goto('/forgot-password')
    await page.fill('input[type="email"]', 'test@example.com')

    await page.route('/api/auth/forgot-password', route =>
      route.fulfill({ status: 200, body: JSON.stringify({ ok: true }) })
    )

    await page.locator('button[type="submit"]').click()
    await expect(page.locator('h2:has-text("Check your email")')).toBeVisible()
    await expect(page.locator('a:has-text("Back to sign in")')).toBeVisible()
  })

  test('forgot-password shows error on API failure', async ({ page }) => {
    await page.goto('/forgot-password')
    await page.fill('input[type="email"]', 'test@example.com')

    await page.route('/api/auth/forgot-password', route =>
      route.fulfill({ status: 500, body: JSON.stringify({ error: 'Server error' }) })
    )

    await page.locator('button[type="submit"]').click()
    await expect(page.locator('text=Server error')).toBeVisible()
  })

  test('forgot-password requires email before submit', async ({ page }) => {
    await page.goto('/forgot-password')
    await page.locator('button[type="submit"]').click()
    // Native HTML5 validation prevents submit — URL stays the same
    await expect(page).toHaveURL('/forgot-password')
  })

  // --- /reset-password page ---

  test('reset-password shows expired-link state when no session', async ({ page }) => {
    await page.goto('/reset-password')
    await expect(page.locator('h2:has-text("Link expired")')).toBeVisible()
    await expect(page.locator('a:has-text("Request a new link")')).toBeVisible()
  })

  test('reset-password expired link points to /forgot-password', async ({ page }) => {
    await page.goto('/reset-password')
    await page.locator('a:has-text("Request a new link")').click()
    await expect(page).toHaveURL('/forgot-password')
  })

  test('reset-password shows checking state briefly on load', async ({ page }) => {
    // Intercept Supabase session call to delay it
    await page.route('**/auth/v1/user**', async route => {
      await new Promise(r => setTimeout(r, 300))
      await route.fulfill({ status: 401, body: JSON.stringify({ message: 'not authenticated' }) })
    })
    await page.goto('/reset-password')
    // Checking state visible briefly
    await expect(page.locator('text=Verifying your link...')).toBeVisible()
    // Then transitions to expired
    await expect(page.locator('h2:has-text("Link expired")')).toBeVisible({ timeout: 5000 })
  })

  // --- Login page "Forgot password?" link ---

  test('login page has forgot password link pointing to /forgot-password', async ({ page }) => {
    await page.goto('/login')
    const link = page.locator('a:has-text("Forgot password?")')
    await expect(link).toBeVisible()
    await expect(link).toHaveAttribute('href', '/forgot-password')
  })

  test('clicking Forgot password? on login navigates to /forgot-password', async ({ page }) => {
    await page.goto('/login')
    await page.locator('a:has-text("Forgot password?")').click()
    await expect(page).toHaveURL('/forgot-password')
    await expect(page.locator('h2:has-text("Reset your password")')).toBeVisible()
  })
})
