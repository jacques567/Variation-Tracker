import { test, expect } from '@playwright/test'

test.describe('PostcodeLookup', () => {
  test.beforeEach(async ({ page }) => {
    // Mock postcodes.io before navigating so the route intercept is in place
    await page.route('https://api.postcodes.io/postcodes/*', async route => {
      const url = route.request().url()
      const postcode = url.split('/postcodes/')[1]

      if (postcode === 'M11AB' || postcode === 'M1%201AB') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            status: 200,
            result: {
              postcode: 'M1 1AB',
              admin_district: 'Manchester',
              admin_county: 'Greater Manchester',
              region: 'North West England',
            },
          }),
        })
      } else if (postcode === 'XX9ZZZ') {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ status: 404, error: 'Postcode not found' }),
        })
      } else {
        await route.fulfill({ status: 500, body: 'error' })
      }
    })

    // Navigate to new job page (unauthenticated — component still renders)
    await page.goto('/jobs/new')
  })

  test('shows postcode lookup UI by default', async ({ page }) => {
    await expect(page.getByPlaceholder('e.g. M1 1AB')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Find address' })).toBeVisible()
    await expect(page.getByText('or enter address manually')).toBeVisible()
  })

  test('valid postcode shows street input and autofilled town', async ({ page }) => {
    await page.getByPlaceholder('e.g. M1 1AB').fill('M1 1AB')
    await page.getByRole('button', { name: 'Find address' }).click()

    await expect(page.getByPlaceholder('House number and street name')).toBeVisible()
    await expect(page.locator('input[readonly]')).toHaveValue('Manchester, Greater Manchester, M1 1AB')
    await expect(page.getByText('Enter address manually instead')).toBeVisible()
  })

  test('valid postcode + street assembles correct address value', async ({ page }) => {
    await page.getByPlaceholder('e.g. M1 1AB').fill('M1 1AB')
    await page.getByRole('button', { name: 'Find address' }).click()
    await page.getByPlaceholder('House number and street name').fill('14 Maple Street')

    // The assembled value goes into sessionStorage via onAddressChange
    const address = await page.evaluate(() =>
      Object.values(sessionStorage).find(v => {
        try { return JSON.parse(v)?.address?.includes('Maple') } catch { return false }
      })
    )
    const parsed = address ? JSON.parse(address) : null
    expect(parsed?.address).toBe('14 Maple Street, Manchester, M1 1AB')
  })

  test('invalid postcode shows not found error', async ({ page }) => {
    await page.getByPlaceholder('e.g. M1 1AB').fill('XX9 ZZZ')
    await page.getByRole('button', { name: 'Find address' }).click()

    await expect(page.getByText('Postcode not found — check and try again')).toBeVisible()
    // Should stay in lookup mode
    await expect(page.getByPlaceholder('e.g. M1 1AB')).toBeVisible()
  })

  test('enter manually link switches to free-text input', async ({ page }) => {
    await page.getByText('or enter address manually').click()

    await expect(page.getByPlaceholder('14 Maple Street, Manchester, M1 1AB')).toBeVisible()
    await expect(page.getByText('Use postcode lookup instead')).toBeVisible()
    // Lookup elements should be gone
    await expect(page.getByPlaceholder('e.g. M1 1AB')).not.toBeVisible()
  })

  test('manual mode allows free text entry', async ({ page }) => {
    await page.getByText('or enter address manually').click()
    await page.getByPlaceholder('14 Maple Street, Manchester, M1 1AB').fill('Some Custom Address, London, SW1A 1AA')

    const address = await page.evaluate(() =>
      Object.values(sessionStorage).find(v => {
        try { return JSON.parse(v)?.address?.includes('Custom') } catch { return false }
      })
    )
    const parsed = address ? JSON.parse(address) : null
    expect(parsed?.address).toBe('Some Custom Address, London, SW1A 1AA')
  })

  test('switch back to lookup from manual mode', async ({ page }) => {
    await page.getByText('or enter address manually').click()
    await page.getByText('Use postcode lookup instead').click()

    await expect(page.getByPlaceholder('e.g. M1 1AB')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Find address' })).toBeVisible()
  })

  test('enter key triggers find', async ({ page }) => {
    await page.getByPlaceholder('e.g. M1 1AB').fill('M1 1AB')
    await page.getByPlaceholder('e.g. M1 1AB').press('Enter')

    await expect(page.getByPlaceholder('House number and street name')).toBeVisible()
  })
})
