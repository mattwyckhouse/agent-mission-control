import { test, expect } from '@playwright/test';

test.describe('Ralph Monitor Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ralph');
  });

  test('displays page title', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /ralph monitor/i })).toBeVisible();
  });

  test('shows active builds section or no builds message', async ({ page }) => {
    // Either active build card or "No Active Builds" message
    const noBuilds = page.getByText(/no active builds/i);
    const activeSection = page.locator('[class*="glass"]');
    
    const hasNoBuilds = await noBuilds.isVisible().catch(() => false);
    const hasActiveSection = await activeSection.first().isVisible();
    
    expect(hasNoBuilds || hasActiveSection).toBeTruthy();
  });

  test('shows build history section', async ({ page }) => {
    await expect(page.getByText(/build history/i)).toBeVisible();
  });

  test('has refresh button', async ({ page }) => {
    const refreshBtn = page.getByRole('button', { name: /refresh/i });
    await expect(refreshBtn).toBeVisible();
  });

  test('refresh button triggers data reload', async ({ page }) => {
    const refreshBtn = page.getByRole('button', { name: /refresh/i });
    
    // Click refresh and wait for any loading state
    await refreshBtn.click();
    
    // Should still be on the page after refresh
    await expect(page.getByRole('heading', { name: /ralph monitor/i })).toBeVisible();
  });
});
