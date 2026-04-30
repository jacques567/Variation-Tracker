import { test, expect } from '@playwright/test';

test.describe('Form Interactions', () => {
  test('login form can be filled', async ({ page }) => {
    await page.goto('/login');
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');

    await emailInput.fill('test@example.com');
    await passwordInput.fill('password123');

    await expect(emailInput).toHaveValue('test@example.com');
    await expect(passwordInput).toHaveValue('password123');
  });

  test('register form can be filled', async ({ page }) => {
    await page.goto('/register');
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');

    await emailInput.fill('newuser@example.com');
    await passwordInput.fill('securepassword123');

    await expect(emailInput).toHaveValue('newuser@example.com');
    await expect(passwordInput).toHaveValue('securepassword123');
  });

  test('password field masks input', async ({ page }) => {
    await page.goto('/login');
    const passwordInput = page.locator('input[type="password"]');

    await passwordInput.fill('mysecretpassword');
    const inputType = await passwordInput.getAttribute('type');

    expect(inputType).toBe('password');
  });

  test('form submit button exists', async ({ page }) => {
    await page.goto('/login');
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible();
  });
});
