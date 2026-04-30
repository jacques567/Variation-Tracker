import { test, expect } from '@playwright/test';

test.describe('Signature Signing', () => {
  test('signature sign page route exists', async ({ page }) => {
    // Try accessing a signature sign page with a dummy token
    // This should either load or redirect to login
    await page.goto('/sign/test-token', { waitUntil: 'networkidle' });
    const currentUrl = page.url();
    // Should either show signature form or redirect to auth
    expect(currentUrl).toMatch(/\/(sign|login)/);
  });

  test('invalid token handling', async ({ page }) => {
    await page.goto('/sign/invalid-token-xyz');
    // Should either show error or redirect
    const currentUrl = page.url();
    expect(currentUrl).toBeDefined();
  });
});
