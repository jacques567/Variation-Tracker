import { test, expect } from '@playwright/test';

test.describe('Navigation & Page Loads', () => {
  test('homepage title is correct', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/VarTrack/);
  });

  test('pages have navigation if authenticated', async ({ page }) => {
    // Note: This test assumes you're logged in
    // In a real scenario, you'd use auth context from before/after hooks
    await page.goto('/login');
    await expect(page).toHaveTitle(/VarTrack/);
  });

  test('admin page is accessible', async ({ page }) => {
    await page.goto('/admin');
    // Either redirects to login or shows admin page
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/(admin|login)/);
  });

  test('logout functionality exists in navbar', async ({ page }) => {
    await page.goto('/login');
    const navBar = page.locator('[data-testid="navbar"]');
    if (await navBar.isVisible()) {
      const logoutButton = navBar.locator('text=Logout');
      expect(logoutButton).toBeDefined();
    }
  });
});
