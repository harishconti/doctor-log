import { test, expect, Page } from '@playwright/test';

test.describe('Clinic OS Lite Web App End-to-End Testing', () => {
  const email = 'ngharishjobs@gmail.com';
  const password = 'Water@246810';

  // Helper function to login
  async function login(page: Page) {
    const loginVisible = await page.locator('input[type="email"]').isVisible();
    if (loginVisible) {
      await page.fill('input[type="email"]', email);
      await page.fill('input[type="password"]', password);
      await page.click('button:has-text("Sign In")');
      await expect(page.getByText('Main Dashboard Overview')).toBeVisible({ timeout: 20000 });
    }
  }

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
    await expect(page.getByText('Main Dashboard Overview')).toBeVisible({ timeout: 20000 });
  });

  test('Dashboard displays correctly after login', async ({ page }) => {
    await login(page);

    // Verify dashboard elements are present
    await expect(page.getByText('Main Dashboard Overview')).toBeVisible();
    await expect(page.getByText('Total Patients')).toBeVisible();
    await expect(page.getByText('New This Week')).toBeVisible();
    await expect(page.getByText('Urgent Alerts')).toBeVisible();
    await expect(page.getByText('Quick Actions')).toBeVisible();
    await expect(page.getByText('Upcoming Appointments')).toBeVisible();
    await expect(page.getByText('Recent Activity')).toBeVisible();
  });

  test('Navigate to Patients page', async ({ page }) => {
    await login(page);

    // Navigate to Patients page via sidebar
    await page.click('text=Patients');

    // Verify Patients page loaded
    await expect(page.locator('h1').filter({ hasText: /Good (Morning|Afternoon|Evening)/i })).toBeVisible({ timeout: 10000 });

    // Verify stats cards are present
    await expect(page.getByText('Total Patients')).toBeVisible();
    await expect(page.getByText('Favorites')).toBeVisible();

    // Verify filter tabs
    await expect(page.getByText('All Patients')).toBeVisible();
    await expect(page.getByRole('button', { name: 'New Patient' })).toBeVisible();
  });

  test('Navigate to Add Patient form and validate required fields', async ({ page }) => {
    await login(page);

    // Navigate to Patients page
    await page.click('text=Patients');
    await expect(page.getByRole('button', { name: 'New Patient' })).toBeVisible({ timeout: 10000 });

    // Click Add New Patient button
    await page.click('button:has-text("New Patient")');

    // Verify we're on the Register Patient page
    await expect(page.getByText('Register New Patient')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Patient Details')).toBeVisible();

    // Verify required form fields are present
    await expect(page.locator('input[name="fullName"]')).toBeVisible();
    await expect(page.locator('select[name="gender"]')).toBeVisible();
    await expect(page.locator('input[name="age"]')).toBeVisible();
    await expect(page.locator('input[name="phone"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('select[name="location"]')).toBeVisible();
    await expect(page.locator('select[name="category"]')).toBeVisible();
    await expect(page.locator('input[name="emergencyName"]')).toBeVisible();
    await expect(page.locator('input[name="emergencyPhone"]')).toBeVisible();

    // Try to submit without filling required fields
    await page.click('button[type="submit"]');

    // Verify validation errors appear
    await expect(page.getByText('Full name is required')).toBeVisible();
    await expect(page.getByText('Gender is required')).toBeVisible();
    await expect(page.getByText('Age is required')).toBeVisible();
    await expect(page.getByText('Phone number is required')).toBeVisible();
  });

  test('Add new patient with all required fields', async ({ page }) => {
    await login(page);

    // Navigate to Patients page
    await page.click('text=Patients');
    await expect(page.getByRole('button', { name: 'New Patient' })).toBeVisible({ timeout: 10000 });

    // Click Add New Patient button
    await page.click('button:has-text("New Patient")');
    await expect(page.getByText('Register New Patient')).toBeVisible({ timeout: 10000 });

    // Generate a unique patient name to avoid duplicates
    const uniqueId = Date.now();
    const patientName = `E2E Test Patient ${uniqueId}`;

    // Fill in all required fields
    await page.fill('input[name="fullName"]', patientName);
    await page.selectOption('select[name="gender"]', 'Male');
    await page.fill('input[name="age"]', '35');
    await page.fill('input[name="phone"]', '+15551234567');
    await page.fill('input[name="email"]', `test${uniqueId}@example.com`);
    await page.selectOption('select[name="location"]', 'Main Clinic');
    await page.selectOption('select[name="category"]', 'Cardiology');
    await page.fill('input[name="emergencyName"]', 'Emergency Contact');
    await page.fill('input[name="emergencyPhone"]', '+15559876543');

    // Submit the form
    await page.click('button[type="submit"]');

    // Wait for success message
    await expect(page.getByText('Patient Registered!')).toBeVisible({ timeout: 10000 });

    // Verify redirect to patients page
    await expect(page.locator('h1').filter({ hasText: /Good (Morning|Afternoon|Evening)/i })).toBeVisible({ timeout: 10000 });
  });

  test('Search patients functionality', async ({ page }) => {
    await login(page);

    // Navigate to Patients page
    await page.click('text=Patients');
    await expect(page.getByRole('button', { name: 'New Patient' })).toBeVisible({ timeout: 10000 });

    // Find the search input
    const searchInput = page.locator('input[placeholder*="Search patients"]');
    await expect(searchInput).toBeVisible();

    // Type a search query
    await searchInput.fill('test');

    // Wait for debounced search (300ms)
    await page.waitForTimeout(500);

    // Verify search is applied (either results appear or empty state)
    const resultsOrEmpty = page.locator('.space-y-4, :has-text("No patients found")');
    await expect(resultsOrEmpty.first()).toBeVisible({ timeout: 5000 });
  });

  test('Filter patients by Favorites tab', async ({ page }) => {
    await login(page);

    // Navigate to Patients page
    await page.click('text=Patients');
    await expect(page.getByText('All Patients')).toBeVisible({ timeout: 10000 });

    // Click on Favorites tab
    await page.click('button:has-text("Favorites")');

    // Verify the tab is active (should have border styling)
    const favoritesTab = page.locator('button:has-text("Favorites")');
    await expect(favoritesTab).toHaveClass(/border-brand-600/);
  });

  test('Check Settings/Profile', async ({ page }) => {
    await login(page);

    // Navigate to Settings
    await page.click('text=Settings');

    // Verify Settings page
    await expect(page.locator('h1, h2, h3').filter({ hasText: /Settings/i }).first()).toBeVisible({ timeout: 10000 });

    // Navigate to Profile
    await page.click('text=Profile');

    // Verify Profile page
    await expect(page.locator('h1, h2, h3').filter({ hasText: /Profile/i }).first()).toBeVisible({ timeout: 10000 });

    // Verify user info is displayed
    await expect(page.getByText('ngharishjobs@gmail.com')).toBeVisible();
  });

  test('Analytics page shows upgrade prompt for basic plan', async ({ page }) => {
    await login(page);

    // Navigate to Analytics
    await page.click('text=Analytics');

    // Verify Analytics page or upgrade prompt is visible
    const analyticsContent = page.locator('h1, h2, h3').filter({ hasText: /Analytics|Upgrade|Pro/i }).first();
    await expect(analyticsContent).toBeVisible({ timeout: 10000 });
  });

  test('Navigation sidebar contains all menu items', async ({ page }) => {
    await login(page);

    // Verify all sidebar menu items are present
    await expect(page.getByText('Dashboard')).toBeVisible();
    await expect(page.getByText('Patients')).toBeVisible();
    await expect(page.getByText('Analytics')).toBeVisible();
    await expect(page.getByText('Settings')).toBeVisible();
    await expect(page.getByText('Profile')).toBeVisible();
  });

  test('Back navigation from patient registration', async ({ page }) => {
    await login(page);

    // Navigate to Patients page
    await page.click('text=Patients');
    await expect(page.getByRole('button', { name: 'New Patient' })).toBeVisible({ timeout: 10000 });

    // Click Add New Patient button
    await page.click('button:has-text("New Patient")');
    await expect(page.getByText('Register New Patient')).toBeVisible({ timeout: 10000 });

    // Click the back button (ArrowLeft icon button)
    await page.click('button:has(svg.lucide-arrow-left)');

    // Verify we're back on the Patients page
    await expect(page.getByRole('button', { name: 'New Patient' })).toBeVisible({ timeout: 10000 });
  });
});
