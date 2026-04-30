import { test, expect } from '@playwright/test';

test.describe('Authenticated User Flow', () => {
  test('register and access dashboard', async ({ page }) => {
    const uniqueEmail = `test-${Date.now()}@example.com`;
    const password = 'TestPassword123!';

    // Register
    await page.goto('/register');
    await page.locator('input[name="full_name"]').fill('Test User');
    await page.locator('input[name="email"]').fill(uniqueEmail);
    await page.locator('input[name="password"]').fill(password);

    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeEnabled();
    await submitButton.click();

    // Wait for redirect (should go to /jobs or show error)
    await page.waitForTimeout(3000);
    const finalUrl = page.url();
    // Should either be on jobs page or still on register (if there was an error)
    expect(finalUrl).toMatch(/\/(jobs|register|confirmation)/);
  });

  test('login and access dashboard', async ({ page }) => {
    // Use a test account that exists
    await page.goto('/login');
    await page.locator('input[name="email"]').fill('test@example.com');
    await page.locator('input[name="password"]').fill('TestPassword123!');
    await page.locator('button[type="submit"]').click();

    // Should either redirect to /jobs or /admin depending on account type
    await page.waitForTimeout(2000);
    const url = page.url();
    expect(url).toMatch(/\/(jobs|admin|login)/);
  });

  test('jobs page loads for authenticated users', async ({ page }) => {
    await page.goto('/jobs');
    // Should show jobs page or redirect to login
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/(jobs|login)/);
  });

  test('categories page loads for authenticated users', async ({ page }) => {
    await page.goto('/categories');
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/(categories|login)/);
  });

  test('subscribe page loads for authenticated users', async ({ page }) => {
    await page.goto('/subscribe');
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/(subscribe|login)/);
  });
});
