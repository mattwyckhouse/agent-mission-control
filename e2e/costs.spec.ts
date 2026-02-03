import { test, expect } from '@playwright/test';

test.describe('Cost Tracker Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/costs');
  });

  test('displays page title', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /cost tracker/i })).toBeVisible();
  });

  test('shows summary metric cards', async ({ page }) => {
    // Check for today/week cost display
    await expect(page.getByText(/today/i)).toBeVisible();
    await expect(page.getByText(/this week/i)).toBeVisible();
  });

  test('shows cost by agent chart', async ({ page }) => {
    await expect(page.getByText(/cost by agent/i)).toBeVisible();
  });

  test('shows tokens by agent chart', async ({ page }) => {
    await expect(page.getByText(/tokens by agent/i)).toBeVisible();
  });

  test('shows detailed breakdown table', async ({ page }) => {
    await expect(page.getByText(/detailed breakdown/i)).toBeVisible();
    
    // Table should have column headers
    await expect(page.getByText('Agent')).toBeVisible();
    await expect(page.getByText('Runs')).toBeVisible();
    await expect(page.getByText('Cost')).toBeVisible();
  });

  test('shows daily trend sparkline', async ({ page }) => {
    await expect(page.getByText(/daily cost trend/i)).toBeVisible();
    
    // SVG sparkline should be present
    const svg = page.locator('svg');
    await expect(svg.first()).toBeVisible();
  });

  test('displays cost values with dollar sign', async ({ page }) => {
    // Cost values should be formatted as currency
    const dollarValues = page.locator('text=/\\$\\d+/');
    const count = await dollarValues.count();
    expect(count).toBeGreaterThan(0);
  });
});
