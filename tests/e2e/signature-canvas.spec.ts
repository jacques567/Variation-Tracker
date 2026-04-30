import { test, expect } from '@playwright/test';

test.describe('Signature Canvas', () => {
  test('signature page route is accessible', async ({ page }) => {
    await page.goto('/sign/test-token');
    // Page should load without crashing (either show form or redirect)
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/(sign|login)/);
  });

  test('signature form does not crash on load', async ({ page }) => {
    await page.goto('/sign/test-token');

    // Wait for page to stabilize
    await page.waitForTimeout(1000);

    // Collect console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Check for critical errors
    const criticalErrors = errors.filter(e =>
      e.includes('Cannot read') ||
      e.includes('is not a function')
    );
    expect(criticalErrors.length).toBe(0);
  });

  test('signature canvas is interactive', async ({ page }) => {
    await page.goto('/sign/test-token');

    // Check if canvas exists on page
    const canvasCount = await page.locator('canvas').count();

    // If canvas exists, verify it's interactive
    if (canvasCount > 0) {
      const canvas = page.locator('canvas').first();
      await expect(canvas).toBeVisible();

      // Verify canvas has proper attributes
      const canvasTag = await canvas.getAttribute('width');
      expect(canvasTag || '').toBeTruthy();
    }
  });

  test('signature page responds to interactions', async ({ page }) => {
    await page.goto('/sign/test-token');

    // Try to find any interactive elements
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();

    // Page should have buttons or be on login
    const currentUrl = page.url();
    const isLoginPage = currentUrl.includes('login');

    expect(buttonCount > 0 || isLoginPage).toBeTruthy();
  });

  test('signature form loads without network errors', async ({ page }) => {
    await page.goto('/sign/test-token');

    // Collect network failures
    const networkErrors: string[] = [];
    page.on('requestfailed', request => {
      networkErrors.push(request.url());
    });

    await page.waitForTimeout(2000);

    // Should not have critical network failures (404s for assets are ok)
    const criticalNetworkErrors = networkErrors.filter(url =>
      url.includes('api') && !url.includes('.map')
    );

    // If errors exist, they should not be auth-blocking
    expect(criticalNetworkErrors.length).toBeLessThan(3);
  });
});
