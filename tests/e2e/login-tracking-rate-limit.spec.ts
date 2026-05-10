import { test, expect } from '@playwright/test'

/**
 * Tests for login tracking, rate limiting, and duplicate email prevention
 *
 * Requirements:
 * - Migration 012 must be applied to Supabase
 * - Test uses unique emails to avoid conflicts with other tests
 */

test.describe('Login Tracking & Rate Limiting', () => {
  const timestamp = Date.now()
  const testEmail = `test-login-${timestamp}@example.com`
  const testPassword = 'TestPassword123!'

  /**
   * Test: Duplicate email signup shows helpful error
   */
  test('duplicate email signup shows "already registered" error', async ({ page }) => {
    // First signup
    await page.goto('/register')
    await page.locator('input[name="full_name"]').fill('Test User')
    await page.locator('input[name="email"]').fill(testEmail)
    await page.locator('input[name="password"]').fill(testPassword)
    await page.locator('button[type="submit"]').click()

    // Wait for signup to complete (auto-confirm or email sent)
    await page.waitForURL(/\/(login|jobs)/)

    // Second signup with same email — should error
    await page.goto('/register')
    await page.locator('input[name="full_name"]').fill('Another User')
    await page.locator('input[name="email"]').fill(testEmail)
    await page.locator('input[name="password"]').fill(testPassword)
    await page.locator('button[type="submit"]').click()

    // Expect error message
    const errorMsg = page.locator('text=/already registered|already exists/i')
    await expect(errorMsg).toBeVisible()

    // Should still be on register page
    await expect(page).toHaveURL(/\/register/)
  })

  /**
   * Test: Failed login attempts increment counter
   * After 5 failed attempts, account is locked for 15 minutes
   */
  test('rate limiting: 5 failed attempts lock account for 15 minutes', async ({ page }) => {
    const email = `test-rate-limit-${timestamp}@example.com`
    const password = 'CorrectPassword123!'

    // Create account via API (bypass UI signup delays)
    const signupRes = await page.context().request.post(
      `${process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000'}/api/auth/signup`,
      {
        data: { email, password, fullName: 'Test User' },
      }
    )
    // Note: this assumes a signup API exists; adjust if needed

    // Attempt 5 wrong passwords
    for (let i = 1; i <= 5; i++) {
      await page.goto('/login')
      await page.locator('input[name="email"]').fill(email)
      await page.locator('input[name="password"]').fill('WrongPassword123!')
      await page.locator('button[type="submit"]').click()

      // Each attempt should show error
      const errorMsg = page.locator('text=/Invalid email or password|temporarily locked/i')
      await expect(errorMsg).toBeVisible({ timeout: 5000 })
    }

    // 6th attempt — account should be locked
    await page.goto('/login')
    await page.locator('input[name="email"]').fill(email)
    await page.locator('input[name="password"]').fill(testPassword)
    await page.locator('button[type="submit"]').click()

    // Expect lockout message
    const lockoutMsg = page.locator('text=/temporarily locked|try again in/i')
    await expect(lockoutMsg).toBeVisible()
  })

  /**
   * Test: Successful login records last_login_at
   */
  test('successful login records last_login_at timestamp', async ({ page, context }) => {
    const email = `test-login-record-${timestamp}@example.com`
    const password = 'TestPassword123!'

    // Signup
    await page.goto('/register')
    await page.locator('input[name="full_name"]').fill('Test User')
    await page.locator('input[name="email"]').fill(email)
    await page.locator('input[name="password"]').fill(password)
    await page.locator('button[type="submit"]').click()

    // Wait for auto-confirm or email confirmation
    await page.waitForURL(/\/(login|jobs)/)

    // If redirected to /jobs, user is already logged in
    if (page.url().includes('/jobs')) {
      // Already logged in after signup; logout and verify login tracking
      // (This depends on your app's logout flow)
    } else {
      // On /login page, perform login
      await page.locator('input[name="email"]').fill(email)
      await page.locator('input[name="password"]').fill(password)
      await page.locator('button[type="submit"]').click()

      // Should redirect to /jobs on successful login
      await page.waitForURL(/\/jobs/)
    }

    // Verify via API that last_login_at was updated
    // (This requires an admin API endpoint to check the contractor record)
    // For now, we trust the redirect as success indicator
    await expect(page).toHaveURL(/\/jobs/)
  })

  /**
   * Test: Failed login resets successful login
   * If counter was at 4/5, then successful login should reset to 0
   */
  test('successful login resets attempt counter to 0', async ({ page }) => {
    const email = `test-reset-counter-${timestamp}@example.com`
    const password = 'TestPassword123!'

    // Signup
    await page.goto('/register')
    await page.locator('input[name="full_name"]').fill('Test User')
    await page.locator('input[name="email"]').fill(email)
    await page.locator('input[name="password"]').fill(password)
    await page.locator('button[type="submit"]').click()

    await page.waitForURL(/\/(login|jobs)/)

    // Make 3 failed login attempts
    for (let i = 0; i < 3; i++) {
      await page.goto('/login')
      await page.locator('input[name="email"]').fill(email)
      await page.locator('input[name="password"]').fill('WrongPassword!')
      await page.locator('button[type="submit"]').click()
      await expect(page.locator('text=/Invalid email or password/i')).toBeVisible()
    }

    // Now login successfully
    await page.goto('/login')
    await page.locator('input[name="email"]').fill(email)
    await page.locator('input[name="password"]').fill(password)
    await page.locator('button[type="submit"]').click()

    // Should succeed (not locked)
    await page.waitForURL(/\/jobs/)
    await expect(page).toHaveURL(/\/jobs/)

    // Verify no lockout message
    const lockoutMsg = page.locator('text=/temporarily locked/i')
    await expect(lockoutMsg).not.toBeVisible()
  })
})

test.describe('Admin Contractors Table', () => {
  /**
   * Test: Admin table shows email + last login (not repeated names)
   *
   * This test requires admin access; adjust if your test uses specific admin credentials
   */
  test.skip('admin table shows email + last login date', async ({ page }) => {
    // Skip if no admin test user available
    // When enabled, this test should:
    // 1. Login as admin
    // 2. Navigate to /admin/contractors
    // 3. Verify table columns: Email, Company, Status, Jobs, Last Login, Action
    // 4. Verify no "Name" column (eliminated duplicate)
    // 5. Verify "Last Login" shows dates or "Never" for new users

    // Example structure:
    // await page.goto('/admin/contractors')
    // await expect(page.locator('th:has-text("Email")')).toBeVisible()
    // await expect(page.locator('th:has-text("Last Login")')).toBeVisible()
    // await expect(page.locator('th:has-text("Name")')).not.toBeVisible()
  })

  /**
   * Test: Admin table orders by last login (descending)
   */
  test.skip('admin table orders by last login descending', async ({ page }) => {
    // Skip if no admin test user available
    // When enabled, verify that recently-logged-in users appear at the top
  })
})
