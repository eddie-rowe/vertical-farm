import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  test('should show error when attempting to login with invalid credentials', async ({ page }) => {
    // Navigate to the login page
    await page.goto('/login');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Fill in dummy credentials
    await page.fill('input[type="email"]', 'dummy@example.com');
    await page.fill('input[type="password"]', 'wrongpassword123');
    
    // Click the login button
    await page.click('button[type="submit"]');
    
    // Wait for the error to appear
    await page.waitForTimeout(2000);
    
    // Check for error message (this could be a toast, alert, or error text)
    // Adjust the selector based on how your app displays login errors
    const errorMessage = page.locator('[data-testid="error-message"]')
      .or(page.locator('.error'))
      .or(page.locator('[role="alert"]'))
      .or(page.getByText(/invalid/i))
      .or(page.getByText(/error/i))
      .or(page.getByText(/failed/i));
    
    // Verify that an error message is displayed
    await expect(errorMessage.first()).toBeVisible({ timeout: 5000 });
    
    // Verify we're still on the login page (not redirected)
    await expect(page).toHaveURL(/.*login.*/);
    
    // Verify the form is still visible (user can try again)
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('should clear password field after failed login attempt', async ({ page }) => {
    // Navigate to the login page
    await page.goto('/login');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Fill in dummy credentials
    await page.fill('input[type="email"]', 'test@invalid.com');
    await page.fill('input[type="password"]', 'badpassword');
    
    // Click the login button
    await page.click('button[type="submit"]');
    
    // Wait for the login attempt to complete
    await page.waitForTimeout(2000);
    
    // Verify email field retains its value
    const emailField = page.locator('input[type="email"]');
    await expect(emailField).toHaveValue('test@invalid.com');
    
    // Verify password field is cleared for security
    const passwordField = page.locator('input[type="password"]');
    await expect(passwordField).toHaveValue('');
  });
}); 