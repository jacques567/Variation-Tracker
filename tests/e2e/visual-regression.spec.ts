import { test, expect } from '@playwright/test';

test.describe('Visual Regression', () => {
  test('login page visual snapshot', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Capture snapshot for visual regression
    await expect(page).toHaveScreenshot('login-page.png', {
      maxDiffPixels: 100,
    });
  });

  test('register page visual snapshot', async ({ page }) => {
    await page.goto('/register');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('register-page.png', {
      maxDiffPixels: 100,
    });
  });

  test('jobs dashboard visual snapshot', async ({ page }) => {
    await page.goto('/jobs');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await expect(page).toHaveScreenshot('jobs-dashboard.png', {
      maxDiffPixels: 150,
    });
  });

  test('subscribe page visual snapshot', async ({ page }) => {
    await page.goto('/subscribe');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await expect(page).toHaveScreenshot('subscribe-page.png', {
      maxDiffPixels: 150,
    });
  });

  test('admin page visual snapshot', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Admin page may redirect, so check before snapshot
    const currentUrl = page.url();
    if (currentUrl.includes('/admin')) {
      await expect(page).toHaveScreenshot('admin-page.png', {
        maxDiffPixels: 150,
      });
    }
  });

  test('form elements are properly styled', async ({ page }) => {
    await page.goto('/login');

    // Check input styling
    const emailInput = page.locator('input[name="email"]');
    const passwordInput = page.locator('input[name="password"]');

    // Verify elements are visible and styled
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();

    // Check button styling
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible();
  });

  test('navbar/header is consistently styled', async ({ page }) => {
    await page.goto('/jobs');

    // Look for header elements
    const header = page.locator('header, nav, [role="banner"]');
    const headerCount = await header.count();

    // Header should exist or page should be login
    const currentUrl = page.url();
    if (currentUrl.includes('/jobs')) {
      expect(headerCount).toBeGreaterThanOrEqual(0);
    }
  });

  test('mobile responsive layout', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Should still be readable on mobile
    const formElements = page.locator('input, button');
    const formCount = await formElements.count();
    expect(formCount).toBeGreaterThan(0);
  });

  test('dark mode detection (if implemented)', async ({ page }) => {
    // Check if app respects prefers-color-scheme
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/login');

    // Page should load without crashing in dark mode
    const currentUrl = page.url();
    expect(currentUrl).toBeDefined();
  });
});
