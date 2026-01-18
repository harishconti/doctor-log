import { test, expect } from '@playwright/test';

test.describe('Clinic OS Lite Web App End-to-End Testing', () => {
  const email = 'ngharishjobs@gmail.com';
  const password = 'Water@246810';

  test.beforeEach(async ({ page }) => {
    // Go to the base URL (defined in playwright.config.ts)
    await page.goto('/');
  });

  test('User Login Flow', async ({ page }) => {
    // Check if we are on login screen
    const loginVisible = await page.locator('input[type="email"]').isVisible();

    if (!loginVisible) {
        // Assume logged in
        await expect(page.getByText('Main Dashboard Overview')).toBeVisible();
        return;
    }

    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();

    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);

    await page.click('button:has-text("Sign In")');

    // Expect to be on dashboard
    await expect(page.getByText('Main Dashboard Overview')).toBeVisible({ timeout: 15000 });
  });

  test('Navigate to Patients and Add Patient', async ({ page }) => {
    // Ensure we are logged in
    const loginVisible = await page.locator('input[type="email"]').isVisible();
    if (loginVisible) {
        await page.fill('input[type="email"]', email);
        await page.fill('input[type="password"]', password);
        await page.click('button:has-text("Sign In")');
        await expect(page.getByText('Main Dashboard Overview')).toBeVisible({ timeout: 15000 });
    }

    // Navigate to Patients page
    await page.click('text=Patients');

    // Verify Patients page loaded
    await expect(page.locator('h1, h2, h3').filter({ hasText: /Patients/i }).first()).toBeVisible();

    // Add a new patient
    await page.click('text=Add New Patient');

    // RegisterPatientPage
    await page.fill('input[name="full_name"]', 'Playwright Test Patient');
    await page.fill('input[name="phone"]', '+15555555555');

    await page.click('button[type="submit"]');

    // Verify patient is added
    await expect(page.locator('h1, h2, h3').filter({ hasText: /Patients/i }).first()).toBeVisible();
    await expect(page.getByText('Playwright Test Patient')).toBeVisible();
  });

  test('Check Settings/Profile', async ({ page }) => {
     // Ensure logged in
    const loginVisible = await page.locator('input[type="email"]').isVisible();
    if (loginVisible) {
        await page.fill('input[type="email"]', email);
        await page.fill('input[type="password"]', password);
        await page.click('button:has-text("Sign In")');
        await expect(page.getByText('Main Dashboard Overview')).toBeVisible({ timeout: 15000 });
    }

    // Navigate to Settings
    await page.click('text=Settings');

    // Verify Settings page
    await expect(page.locator('h1, h2, h3').filter({ hasText: /Settings/i }).first()).toBeVisible();

    // Navigate to Profile
    await page.click('text=Profile');
     // Verify Profile page
    await expect(page.locator('h1, h2, h3').filter({ hasText: /Profile/i }).first()).toBeVisible();

    // Verify user info is displayed
    await expect(page.getByText('ngharishjobs@gmail.com')).toBeVisible();
  });
});
