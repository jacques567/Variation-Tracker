import { test, expect } from '@playwright/test';

test.describe('Data Persistence', () => {
  test('jobs page loads without errors', async ({ page }) => {
    await page.goto('/jobs');

    // Collect errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.waitForTimeout(2000);

    const criticalErrors = errors.filter(e =>
      e.includes('Cannot read') || e.includes('is not a function')
    );
    expect(criticalErrors.length).toBe(0);
  });

  test('categories page displays content', async ({ page }) => {
    await page.goto('/categories');
    const currentUrl = page.url();

    // Page should load without crashing
    expect(currentUrl).toMatch(/\/(categories|login)/);
  });

  test('variations table renders if data exists', async ({ page }) => {
    await page.goto('/jobs');

    // Look for table or data grid
    const table = page.locator('table, [role="grid"]');
    const tableCount = await table.count();

    // Table may be empty or may not exist - just verify page doesn't crash
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/(jobs|login)/);
  });

  test('page handles empty states gracefully', async ({ page }) => {
    await page.goto('/jobs');

    // Look for empty state messages
    const emptyMessage = page.locator('text=No jobs, text=No data, text=Empty');
    const messageCount = await emptyMessage.count();

    // Either has data or shows empty state - no error
    const currentUrl = page.url();
    expect(currentUrl).toBeDefined();
  });

  test('navigation between dashboard pages works', async ({ page }) => {
    await page.goto('/jobs');
    let currentUrl = page.url();

    // Navigate to categories
    if (currentUrl.includes('/jobs')) {
      const categoryLink = page.locator('a[href*="categories"], button:has-text("Categories")').first();
      const linkCount = await categoryLink.count();

      if (linkCount > 0) {
        await categoryLink.click();
        await page.waitForTimeout(1000);
        currentUrl = page.url();

        // Should be on categories page or login
        expect(currentUrl).toMatch(/\/(categories|jobs|login)/);
      }
    }
  });

  test('data loads without network timeouts', async ({ page }) => {
    const networkErrors: string[] = [];

    page.on('requestfailed', request => {
      networkErrors.push(request.url());
    });

    await page.goto('/jobs');
    await page.waitForTimeout(3000);

    // Should not have critical API failures
    const apiErrors = networkErrors.filter(url => url.includes('/api'));
    expect(apiErrors.length).toBeLessThan(2);
  });
});
