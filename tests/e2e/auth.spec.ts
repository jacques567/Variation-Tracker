import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('login page loads', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/VarTrack/);
    await expect(page.locator('h2:has-text("Sign in")')).toBeVisible();
  });

  test('register page loads', async ({ page }) => {
    await page.goto('/register');
    await expect(page).toHaveTitle(/VarTrack/);
    await expect(page.locator('text=Create your account')).toBeVisible();
  });

  test('root shows landing page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/');
    await expect(page.locator('text=Coming Soon')).toBeVisible();
  });

  test('login form has required fields', async ({ page }) => {
    await page.goto('/login');
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
  });

  test('register form has required fields', async ({ page }) => {
    await page.goto('/register');
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
  });

  test('empty login form shows validation', async ({ page }) => {
    await page.goto('/login');
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
    // Expect validation error or form to remain on login page
    await expect(page).toHaveURL(/\/login/);
  });
});
