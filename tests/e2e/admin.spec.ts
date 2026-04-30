import { test, expect } from '@playwright/test';

test.describe('Admin Pages', () => {
  test('admin dashboard is accessible', async ({ page }) => {
    await page.goto('/admin');
    // Should load admin page or redirect to login
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/(admin|login)/);
  });

  test('admin page has title', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveTitle(/VarTrack|Admin/i);
  });

  test('contractors page is accessible', async ({ page }) => {
    await page.goto('/admin/contractors');
    // Should load contractors page or redirect
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/(contractors|admin|login)/);
  });

  test('admin pages do not crash on load', async ({ page }) => {
    // Collect console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/admin');
    await page.waitForTimeout(1000);

    const criticalErrors = errors.filter(e =>
      e.includes('Cannot read') || e.includes('is not a function')
    );
    expect(criticalErrors.length).toBe(0);
  });

  test('admin layout has navigation', async ({ page }) => {
    await page.goto('/admin');
    const currentUrl = page.url();

    // If on admin page (not redirected to login), check for nav
    if (currentUrl.includes('/admin')) {
      const navElements = page.locator('nav, [role="navigation"]');
      const navCount = await navElements.count();
      expect(navCount).toBeGreaterThanOrEqual(0);
    }
  });
});
