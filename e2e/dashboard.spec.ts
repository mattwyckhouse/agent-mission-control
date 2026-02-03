import { test, expect } from '@playwright/test';

test.describe('Dashboard Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('displays page title and header', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /squad status/i })).toBeVisible();
  });

  test('shows 4 metric cards', async ({ page }) => {
    const metricCards = page.locator('[data-testid="metric-card"]');
    // If no test IDs, look for the metric card structure
    const cards = page.locator('.grid').first().locator('> div');
    await expect(cards).toHaveCount(4);
  });

  test('displays agent grid', async ({ page }) => {
    // Look for agent cards section
    await expect(page.getByRole('heading', { name: /agent squad/i })).toBeVisible();
  });

  test('shows recent activity section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /recent activity/i })).toBeVisible();
  });

  test('agent card click navigates to detail page', async ({ page }) => {
    // Find first agent card and click it
    const agentCard = page.locator('[class*="cursor-pointer"]').first();
    
    if (await agentCard.count() > 0) {
      await agentCard.click();
      await expect(page).toHaveURL(/\/agent\//);
    }
  });

  test('has no console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Filter out common non-critical errors
    const criticalErrors = errors.filter(e => 
      !e.includes('favicon') && 
      !e.includes('hydration')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });
});
