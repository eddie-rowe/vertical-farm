// frontend/tests/e2e/app.e2e.test.js
import { test, expect } from '@playwright/test';

test('homepage has welcome message', async ({ page }) => {
    // Navigate to the homepage
    await page.goto('http://localhost:3000'); // Adjust the URL if necessary

    // Check if the welcome message is present
    const welcomeMessage = await page.locator('text=Welcome'); // Adjust based on your app's content
    await expect(welcomeMessage).toBeVisible();
});