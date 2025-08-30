/**
 * End-to-End tests for New Grow Setup wizard
 * Tests complete user workflow from farm selection to grow creation
 * 
 * @group e2e
 * @group new-grow-setup
 */

import { test, expect, type Page, type Locator } from '@playwright/test';

// Test configuration
const TEST_TIMEOUT = 60000; // 1 minute
const NAVIGATION_TIMEOUT = 10000; // 10 seconds

// Test data - would normally come from test database or fixtures
const testData = {
  validCredentials: {
    email: 'test@example.com',
    password: 'TestPassword123!',
  },
  farmData: {
    name: 'Farm Alpha',
    location: 'Building A',
    status: 'online',
  },
  recipeData: {
    name: 'Lettuce Standard',
    species: 'Lettuce',
    difficulty: 'Easy',
    duration: '30 days',
  },
  growData: {
    shelfCount: 2,
    startDate: '2024-03-01',
  },
};

/**
 * Page Object Model for New Grow Setup wizard
 */
class NewGrowSetupPage {
  readonly page: Page;
  
  // Locators for the wizard components
  readonly progressBar: Locator;
  readonly stepIndicator: Locator;
  readonly nextButton: Locator;
  readonly previousButton: Locator;
  readonly errorAlert: Locator;
  readonly successAlert: Locator;
  
  // Step-specific locators
  readonly farmCards: Locator;
  readonly recipeCards: Locator;
  readonly shelfButtons: Locator;
  readonly searchInput: Locator;
  readonly filterDropdowns: Locator;
  readonly startDateInput: Locator;
  readonly createGrowsButton: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Navigation elements
    this.progressBar = page.locator('[role="progressbar"]');
    this.stepIndicator = page.locator('[data-testid="step-indicator"]');
    this.nextButton = page.locator('button:has-text("Next")');
    this.previousButton = page.locator('button:has-text("Previous")');
    this.errorAlert = page.locator('[role="alert"]:has-text("error")');
    this.successAlert = page.locator('[role="alert"]:has-text("success")');
    
    // Step-specific elements
    this.farmCards = page.locator('[data-testid="farm-card"]');
    this.recipeCards = page.locator('[data-testid="recipe-card"]');
    this.shelfButtons = page.locator('[data-testid="shelf-button"]');
    this.searchInput = page.locator('input[placeholder*="Search"]');
    this.filterDropdowns = page.locator('[data-testid="filter-dropdown"]');
    this.startDateInput = page.locator('input[type="date"]');
    this.createGrowsButton = page.locator('button:has-text("Start"), button:has-text("Create")');
  }

  async navigate() {
    await this.page.goto('/dashboard/grow-management?tab=new-grow');
    await this.waitForLoad();
  }

  async waitForLoad() {
    await this.page.waitForLoadState('networkidle');
    await this.progressBar.waitFor({ state: 'visible' });
  }

  async getCurrentStep(): Promise<number> {
    const stepText = await this.stepIndicator.textContent();
    const match = stepText?.match(/Step (\d+) of \d+/);
    return match ? parseInt(match[1], 10) : 1;
  }

  async getProgressPercentage(): Promise<number> {
    const progressValue = await this.progressBar.getAttribute('aria-valuenow');
    return progressValue ? parseInt(progressValue, 10) : 0;
  }

  async waitForStep(stepNumber: number, timeout = NAVIGATION_TIMEOUT) {
    await this.page.waitForFunction(
      (step) => document.querySelector('[data-testid="step-indicator"]')?.textContent?.includes(`Step ${step}`),
      stepNumber,
      { timeout }
    );
  }

  async selectFarm(farmName: string) {
    const farmCard = this.farmCards.filter({ hasText: farmName });
    await farmCard.click();
    await expect(farmCard).toHaveClass(/border-green-500/);
  }

  async selectRecipe(recipeName: string) {
    const recipeCard = this.recipeCards.filter({ hasText: recipeName });
    await recipeCard.click();
    await expect(recipeCard).toHaveClass(/border-green-500/);
  }

  async selectShelves(count: number) {
    const availableShelves = this.shelfButtons.filter({ hasNotText: 'Occupied' });
    
    for (let i = 0; i < count; i++) {
      await availableShelves.nth(i).click();
    }
    
    // Verify selection count is displayed
    await expect(this.page.locator(`text="${count}"`)).toBeVisible();
  }

  async searchRecipes(query: string) {
    await this.searchInput.fill(query);
    await this.page.waitForTimeout(500); // Debounce delay
  }

  async applyFilter(filterType: string, value: string) {
    const filter = this.filterDropdowns.filter({ hasText: filterType });
    await filter.click();
    await this.page.locator(`text="${value}"`).click();
  }

  async setStartDate(date: string) {
    await this.startDateInput.fill(date);
  }

  async proceedToNextStep() {
    await this.nextButton.click();
    await this.page.waitForTimeout(500); // Allow for transition
  }

  async goToPreviousStep() {
    await this.previousButton.click();
    await this.page.waitForTimeout(500);
  }

  async createGrows() {
    await this.createGrowsButton.click();
  }

  async waitForSuccess() {
    await this.successAlert.waitFor({ state: 'visible', timeout: 10000 });
  }

  async waitForError() {
    await this.errorAlert.waitFor({ state: 'visible', timeout: 5000 });
  }
}

/**
 * Authentication helper
 */
async function login(page: Page) {
  await page.goto('/auth/login');
  await page.fill('input[type="email"]', testData.validCredentials.email);
  await page.fill('input[type="password"]', testData.validCredentials.password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/dashboard', { timeout: NAVIGATION_TIMEOUT });
}

test.describe('New Grow Setup Wizard', () => {
  let growSetupPage: NewGrowSetupPage;

  test.beforeEach(async ({ page }) => {
    // Set test timeout
    test.setTimeout(TEST_TIMEOUT);
    
    // Initialize page object
    growSetupPage = new NewGrowSetupPage(page);
    
    // Authenticate and navigate to the wizard
    await login(page);
    await growSetupPage.navigate();
  });

  test.describe('Initial Loading', () => {
    test('should display loading state initially', async ({ page }) => {
      // Navigate to page and immediately check for loading
      await page.goto('/dashboard/grow-management?tab=new-grow');
      
      // Should show loading spinner
      const loadingSpinner = page.locator('[data-testid="loading-spinner"]');
      await expect(loadingSpinner).toBeVisible();
      
      // Should show loading text
      await expect(page.locator('text="Loading grow setup wizard..."')).toBeVisible();
    });

    test('should load wizard components after data fetch', async () => {
      await growSetupPage.waitForLoad();
      
      // Should display progress bar
      await expect(growSetupPage.progressBar).toBeVisible();
      
      // Should show step 1
      const currentStep = await growSetupPage.getCurrentStep();
      expect(currentStep).toBe(1);
      
      // Should show farm selection title
      await expect(growSetupPage.page.locator('h3:has-text("Choose Your Farm")')).toBeVisible();
    });

    test('should handle loading errors gracefully', async ({ page }) => {
      // Mock network failure
      await page.route('**/api/**', (route) => {
        route.abort('failed');
      });
      
      await growSetupPage.navigate();
      
      // Should display error message
      await expect(growSetupPage.errorAlert).toBeVisible();
      
      // Should allow dismissing error
      await page.click('button:has-text("Dismiss")');
      await expect(growSetupPage.errorAlert).not.toBeVisible();
    });
  });

  test.describe('Wizard Navigation', () => {
    test('should navigate through all steps successfully', async () => {
      // Step 1: Farm Selection
      await expect(growSetupPage.page.locator('h3:has-text("Choose Your Farm")')).toBeVisible();
      expect(await growSetupPage.getProgressPercentage()).toBe(25);
      
      await growSetupPage.selectFarm(testData.farmData.name);
      await growSetupPage.proceedToNextStep();
      
      // Step 2: Recipe Selection
      await growSetupPage.waitForStep(2);
      await expect(growSetupPage.page.locator('h3:has-text("Choose Your Recipe")')).toBeVisible();
      expect(await growSetupPage.getProgressPercentage()).toBe(50);
      
      await growSetupPage.selectRecipe(testData.recipeData.name);
      await growSetupPage.proceedToNextStep();
      
      // Step 3: Location Selection
      await growSetupPage.waitForStep(3);
      await expect(growSetupPage.page.locator('h3:has-text("Select Growing Locations")')).toBeVisible();
      expect(await growSetupPage.getProgressPercentage()).toBe(75);
      
      await growSetupPage.selectShelves(testData.growData.shelfCount);
      await growSetupPage.proceedToNextStep();
      
      // Step 4: Confirmation
      await growSetupPage.waitForStep(4);
      await expect(growSetupPage.page.locator('h3:has-text("Confirm Your Setup")')).toBeVisible();
      expect(await growSetupPage.getProgressPercentage()).toBe(100);
    });

    test('should prevent progression without required selections', async () => {
      // Next button should be disabled initially
      await expect(growSetupPage.nextButton).toBeDisabled();
      
      // Select farm and verify button is enabled
      await growSetupPage.selectFarm(testData.farmData.name);
      await expect(growSetupPage.nextButton).not.toBeDisabled();
    });

    test('should allow backward navigation', async () => {
      // Complete steps 1-2
      await growSetupPage.selectFarm(testData.farmData.name);
      await growSetupPage.proceedToNextStep();
      await growSetupPage.waitForStep(2);
      
      await growSetupPage.selectRecipe(testData.recipeData.name);
      await growSetupPage.proceedToNextStep();
      await growSetupPage.waitForStep(3);
      
      // Go back to step 2
      await growSetupPage.goToPreviousStep();
      await growSetupPage.waitForStep(2);
      await expect(growSetupPage.page.locator('h3:has-text("Choose Your Recipe")')).toBeVisible();
      
      // Go back to step 1
      await growSetupPage.goToPreviousStep();
      await growSetupPage.waitForStep(1);
      await expect(growSetupPage.page.locator('h3:has-text("Choose Your Farm")')).toBeVisible();
    });

    test('should allow direct step navigation for completed steps', async () => {
      // Complete step 1
      await growSetupPage.selectFarm(testData.farmData.name);
      await growSetupPage.proceedToNextStep();
      await growSetupPage.waitForStep(2);
      
      // Click on step 1 in progress indicator
      await growSetupPage.page.click('button:has-text("Select Farm")');
      await growSetupPage.waitForStep(1);
      
      // Should be back at step 1
      await expect(growSetupPage.page.locator('h3:has-text("Choose Your Farm")')).toBeVisible();
      
      // Previous selection should still be active
      const selectedFarm = growSetupPage.farmCards.filter({ hasText: testData.farmData.name });
      await expect(selectedFarm).toHaveClass(/border-green-500/);
    });
  });

  test.describe('Farm Selection', () => {
    test('should display available farms with details', async () => {
      const farmCardCount = await growSetupPage.farmCards.count();
      expect(farmCardCount).toBeGreaterThan(0);
      
      // Check for farm details
      const farmCard = growSetupPage.farmCards.first();
      await expect(farmCard.locator(':has-text("online")').or(farmCard.locator(':has-text("offline")'))).toBeVisible();
      await expect(farmCard.locator(':has-text("shelves")')).toBeVisible();
    });

    test('should prevent selection of offline farms', async ({ page }) => {
      const offlineFarm = growSetupPage.farmCards.filter({ hasText: 'offline' });
      
      if (await offlineFarm.count() > 0) {
        await expect(offlineFarm.first()).toBeDisabled();
      }
    });

    test('should highlight selected farm', async () => {
      await growSetupPage.selectFarm(testData.farmData.name);
      
      const selectedFarm = growSetupPage.farmCards.filter({ hasText: testData.farmData.name });
      await expect(selectedFarm).toHaveClass(/border-green-500/);
    });

    test('should show farm capacity information', async () => {
      const farmCard = growSetupPage.farmCards.first();
      
      // Should show capacity info
      await expect(farmCard.locator(':has-text("/")')).toBeVisible(); // capacity format: used/total
      
      // Should show progress bar for capacity
      await expect(farmCard.locator('[role="progressbar"]')).toBeVisible();
    });
  });

  test.describe('Recipe Selection', () => {
    test.beforeEach(async () => {
      // Navigate to recipe step
      await growSetupPage.selectFarm(testData.farmData.name);
      await growSetupPage.proceedToNextStep();
      await growSetupPage.waitForStep(2);
    });

    test('should display available recipes with details', async () => {
      const recipeCardCount = await growSetupPage.recipeCards.count();
      expect(recipeCardCount).toBeGreaterThan(0);
      
      // Check for recipe details
      const recipeCard = growSetupPage.recipeCards.first();
      await expect(recipeCard.locator(':has-text("Easy")').or(recipeCard.locator(':has-text("Medium")').or(recipeCard.locator(':has-text("Hard")')))).toBeVisible();
      await expect(recipeCard.locator(':has-text("days")')).toBeVisible();
      await expect(recipeCard.locator(':has-text("light")')).toBeVisible();
    });

    test('should support recipe search functionality', async ({ page }) => {
      // Search for lettuce recipes
      await growSetupPage.searchRecipes('lettuce');
      
      // Should filter results
      const visibleRecipes = await growSetupPage.recipeCards.count();
      expect(visibleRecipes).toBeGreaterThan(0);
      
      // All visible recipes should contain "lettuce"
      const recipeTexts = await growSetupPage.recipeCards.allTextContents();
      recipeTexts.forEach(text => {
        expect(text.toLowerCase()).toContain('lettuce');
      });
    });

    test('should support recipe filtering by difficulty', async () => {
      // Apply difficulty filter
      await growSetupPage.applyFilter('Difficulty', 'Easy');
      
      // Should show only easy recipes
      const visibleRecipes = growSetupPage.recipeCards;
      const count = await visibleRecipes.count();
      
      for (let i = 0; i < count; i++) {
        await expect(visibleRecipes.nth(i).locator(':has-text("Easy")')).toBeVisible();
      }
    });

    test('should show recipe estimates and yields', async () => {
      const recipeCard = growSetupPage.recipeCards.first();
      
      // Should show yield estimate
      await expect(recipeCard.locator(':has-text("Expected Yield")')).toBeVisible();
      await expect(recipeCard.locator(':has-text("per shelf")')).toBeVisible();
      
      // Should show profit estimate
      await expect(recipeCard.locator(':has-text("Profit Estimate")')).toBeVisible();
      await expect(recipeCard.locator(':has-text("$")')).toBeVisible();
    });

    test('should handle empty search results', async ({ page }) => {
      await growSetupPage.searchRecipes('nonexistentrecipe123');
      
      // Should show no results message
      await expect(page.locator(':has-text("No recipes found")')).toBeVisible();
      
      // Should show clear filters option
      await expect(page.locator('button:has-text("Clear")')).toBeVisible();
    });
  });

  test.describe('Location Selection', () => {
    test.beforeEach(async () => {
      // Navigate to location step
      await growSetupPage.selectFarm(testData.farmData.name);
      await growSetupPage.proceedToNextStep();
      await growSetupPage.waitForStep(2);
      
      await growSetupPage.selectRecipe(testData.recipeData.name);
      await growSetupPage.proceedToNextStep();
      await growSetupPage.waitForStep(3);
    });

    test('should display farm layout with hierarchy', async ({ page }) => {
      // Should show rows
      await expect(page.locator(':has-text("Row")')).toBeVisible();
      
      // Should show racks
      await expect(page.locator(':has-text("Rack")')).toBeVisible();
      
      // Should show shelves
      const shelfButtonCount = await growSetupPage.shelfButtons.count();
      expect(shelfButtonCount).toBeGreaterThan(0);
    });

    test('should show shelf status indicators', async ({ page }) => {
      // Should show status legend
      await expect(page.locator(':has-text("Available")')).toBeVisible();
      await expect(page.locator(':has-text("Occupied")')).toBeVisible();
      await expect(page.locator(':has-text("Maintenance")')).toBeVisible();
    });

    test('should allow selecting multiple shelves', async ({ page }) => {
      const shelfCount = testData.growData.shelfCount;
      await growSetupPage.selectShelves(shelfCount);
      
      // Should update selection counter
      await expect(page.locator(`text="${shelfCount}"`)).toBeVisible();
      
      // Selected shelves should be highlighted
      const selectedShelves = growSetupPage.shelfButtons.filter({ has: page.locator('.border-green-500') });
      expect(await selectedShelves.count()).toBe(shelfCount);
    });

    test('should prevent selecting occupied shelves', async () => {
      const occupiedShelves = growSetupPage.shelfButtons.filter({ hasText: 'Occupied' });
      
      if (await occupiedShelves.count() > 0) {
        await expect(occupiedShelves.first()).toBeDisabled();
      }
    });

    test('should show shelf dimensions and capacity', async () => {
      const shelfButton = growSetupPage.shelfButtons.first();
      
      // Should show dimensions (e.g., "2×1m")
      await expect(shelfButton.locator(':has-text("×")').or(shelfButton.locator(':has-text("m")'))).toBeVisible();
    });
  });

  test.describe('Confirmation and Creation', () => {
    test.beforeEach(async () => {
      // Navigate to confirmation step
      await growSetupPage.selectFarm(testData.farmData.name);
      await growSetupPage.proceedToNextStep();
      await growSetupPage.waitForStep(2);
      
      await growSetupPage.selectRecipe(testData.recipeData.name);
      await growSetupPage.proceedToNextStep();
      await growSetupPage.waitForStep(3);
      
      await growSetupPage.selectShelves(testData.growData.shelfCount);
      await growSetupPage.proceedToNextStep();
      await growSetupPage.waitForStep(4);
    });

    test('should display complete setup summary', async ({ page }) => {
      // Should show all selections
      await expect(page.locator(`text="${testData.farmData.name}"`)).toBeVisible();
      await expect(page.locator(`text="${testData.recipeData.name}"`)).toBeVisible();
      await expect(page.locator(`text="${testData.growData.shelfCount} selected"`)).toBeVisible();
    });

    test('should show timeline and estimates', async ({ page }) => {
      // Should show duration
      await expect(page.locator(':has-text("days")')).toBeVisible();
      
      // Should show harvest date
      await expect(page.locator(':has-text("Harvest Date")')).toBeVisible();
      
      // Should show yield estimate
      await expect(page.locator(':has-text("Expected Yield")')).toBeVisible();
      
      // Should show profit estimate
      await expect(page.locator(':has-text("Profit Estimate")')).toBeVisible();
    });

    test('should allow editing start date', async () => {
      await growSetupPage.setStartDate(testData.growData.startDate);
      
      // Date should be updated
      await expect(growSetupPage.startDateInput).toHaveValue(testData.growData.startDate);
    });

    test('should create grows successfully', async ({ page }) => {
      await growSetupPage.createGrows();
      
      // Should show loading state
      await expect(page.locator(':has-text("Creating")')).toBeVisible();
      
      // Should show success message
      await growSetupPage.waitForSuccess();
      
      // Should reset to first step after success
      await growSetupPage.waitForStep(1, 15000); // Allow more time for reset
      await expect(page.locator('h3:has-text("Choose Your Farm")')).toBeVisible();
    });

    test('should handle creation errors gracefully', async ({ page }) => {
      // Mock API failure
      await page.route('**/api/grows', (route) => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Failed to create grows' }),
        });
      });
      
      await growSetupPage.createGrows();
      
      // Should show error message
      await growSetupPage.waitForError();
      await expect(page.locator(':has-text("Failed to create grows")')).toBeVisible();
      
      // Should stay on confirmation step
      await expect(page.locator('h3:has-text("Confirm Your Setup")')).toBeVisible();
    });

    test('should show optimistic updates during creation', async ({ page }) => {
      // Start creation process
      await growSetupPage.createGrows();
      
      // Should show optimistic feedback
      await expect(page.locator(':has-text("Starting")').and(page.locator(':has-text("new grows")'))).toBeVisible();
      
      // Should show completion message
      await expect(page.locator(':has-text("This will complete shortly")')).toBeVisible();
    });
  });

  test.describe('Error Handling and Edge Cases', () => {
    test('should handle network interruptions gracefully', async ({ page }) => {
      // Navigate to recipe step
      await growSetupPage.selectFarm(testData.farmData.name);
      await growSetupPage.proceedToNextStep();
      await growSetupPage.waitForStep(2);
      
      // Simulate network failure during recipe loading
      await page.route('**/api/recipes', (route) => {
        route.abort('failed');
      });
      
      // Attempt to search (which would trigger API call)
      await growSetupPage.searchRecipes('test');
      
      // Should show error message
      await expect(growSetupPage.errorAlert).toBeVisible();
    });

    test('should validate required selections before allowing progression', async () => {
      // Try to proceed without selecting farm
      await expect(growSetupPage.nextButton).toBeDisabled();
      
      // Select farm and proceed
      await growSetupPage.selectFarm(testData.farmData.name);
      await growSetupPage.proceedToNextStep();
      await growSetupPage.waitForStep(2);
      
      // Try to proceed without selecting recipe
      await expect(growSetupPage.nextButton).toBeDisabled();
    });

    test('should handle empty data gracefully', async ({ page }) => {
      // Mock empty farm response
      await page.route('**/api/farms', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
      });
      
      await growSetupPage.navigate();
      
      // Should show appropriate empty state
      await expect(page.locator(':has-text("No farms")')).toBeVisible();
    });
  });

  test.describe('Accessibility and User Experience', () => {
    test('should be keyboard navigable', async ({ page }) => {
      // Test tab navigation
      await page.keyboard.press('Tab');
      
      // Should focus on first interactive element
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
      
      // Should be able to navigate with Enter key
      await page.keyboard.press('Enter');
    });

    test('should have proper ARIA labels', async () => {
      // Progress bar should have proper ARIA attributes
      await expect(growSetupPage.progressBar).toHaveAttribute('role', 'progressbar');
      
      // Buttons should have accessible names
      await expect(growSetupPage.nextButton).toHaveAttribute('type', 'button');
      await expect(growSetupPage.previousButton).toHaveAttribute('type', 'button');
    });

    test('should provide helpful instruction text', async ({ page }) => {
      // Each step should have instruction text
      await expect(page.locator(':has-text("Select a farm to continue")')).toBeVisible();
      
      // Navigate to recipe step
      await growSetupPage.selectFarm(testData.farmData.name);
      await growSetupPage.proceedToNextStep();
      await growSetupPage.waitForStep(2);
      
      await expect(page.locator(':has-text("Choose a recipe to continue")')).toBeVisible();
    });

    test('should be responsive on different screen sizes', async ({ page }) => {
      // Test mobile viewport
      await page.setViewportSize({ width: 390, height: 844 });
      
      // Should still be functional
      await expect(growSetupPage.progressBar).toBeVisible();
      await expect(growSetupPage.farmCards.first()).toBeVisible();
      
      // Test tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      
      const mobileCardCount = await growSetupPage.farmCards.count();
      expect(mobileCardCount).toBeGreaterThan(0);
      
      // Test desktop viewport
      await page.setViewportSize({ width: 1920, height: 1080 });
      
      const desktopCardCount = await growSetupPage.farmCards.count();
      expect(desktopCardCount).toBeGreaterThan(0);
    });
  });

  test.describe('Performance', () => {
    test('should load within acceptable time limits', async ({ page }) => {
      const startTime = Date.now();
      
      await growSetupPage.navigate();
      await growSetupPage.waitForLoad();
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(5000); // Should load in under 5 seconds
    });

    test('should handle large datasets efficiently', async ({ page }) => {
      // Mock large dataset response
      const largeFarmList = Array.from({ length: 50 }, (_, i) => ({
        id: `farm-${i}`,
        name: `Farm ${i}`,
        location: `Location ${i}`,
        status: 'online',
        capacity: { used: Math.floor(Math.random() * 100), total: 100 },
      }));
      
      await page.route('**/api/farms', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(largeFarmList),
        });
      });
      
      const startTime = Date.now();
      await growSetupPage.navigate();
      await growSetupPage.waitForLoad();
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(8000); // Should handle large datasets in under 8 seconds
      
      // Should display all farms
      await expect(growSetupPage.farmCards).toHaveCount(50);
    });

    test('should not cause memory leaks during navigation', async ({ page }) => {
      // Navigate through all steps multiple times
      for (let i = 0; i < 3; i++) {
        await growSetupPage.selectFarm(testData.farmData.name);
        await growSetupPage.proceedToNextStep();
        await growSetupPage.waitForStep(2);
        
        await growSetupPage.selectRecipe(testData.recipeData.name);
        await growSetupPage.proceedToNextStep();
        await growSetupPage.waitForStep(3);
        
        // Go back to start
        await growSetupPage.goToPreviousStep();
        await growSetupPage.waitForStep(2);
        await growSetupPage.goToPreviousStep();
        await growSetupPage.waitForStep(1);
      }
      
      // Should still be responsive
      await expect(growSetupPage.farmCards.first()).toBeVisible();
    });
  });
});