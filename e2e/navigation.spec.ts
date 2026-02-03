import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('header navigation works', async ({ page }) => {
    await page.goto('/');
    
    // Check main nav links
    const navLinks = [
      { name: 'Dashboard', url: '/' },
      { name: 'Tasks', url: '/tasks' },
      { name: 'Ralph', url: '/ralph' },
      { name: 'Costs', url: '/costs' },
    ];
    
    for (const link of navLinks) {
      const navLink = page.getByRole('link', { name: link.name });
      await navLink.click();
      await expect(page).toHaveURL(link.url);
    }
  });

  test('settings page is accessible', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.getByRole('heading', { name: /settings/i })).toBeVisible();
  });

  test('logo links to dashboard', async ({ page }) => {
    await page.goto('/tasks');
    
    // Click logo/Mission Control text
    const logo = page.getByRole('link').filter({ hasText: /mission.*control/i }).first();
    await logo.click();
    await expect(page).toHaveURL('/');
  });
});

test.describe('Theme Toggle', () => {
  test('theme toggle button is visible', async ({ page }) => {
    await page.goto('/');
    
    // Look for theme toggle button (has sun/moon icon)
    const themeBtn = page.getByRole('button', { name: /theme/i });
    await expect(themeBtn).toBeVisible();
  });

  test('theme can be toggled', async ({ page }) => {
    await page.goto('/');
    
    const themeBtn = page.getByRole('button', { name: /theme/i });
    await themeBtn.click();
    
    // After click, the document should have either 'light' or 'dark' class
    const html = page.locator('html');
    const className = await html.getAttribute('class') || '';
    
    expect(className.includes('light') || className.includes('dark')).toBeTruthy();
  });

  test('light mode renders correctly', async ({ page }) => {
    await page.goto('/');
    
    // Find and click theme toggle until we're in light mode
    const themeBtn = page.getByRole('button', { name: /theme/i });
    
    for (let i = 0; i < 3; i++) {
      await themeBtn.click();
      const html = page.locator('html');
      const className = await html.getAttribute('class') || '';
      
      if (className.includes('light')) {
        // Verify light mode styling
        const body = page.locator('body');
        const bgColor = await body.evaluate(el => 
          getComputedStyle(el).backgroundColor
        );
        
        // Light mode should have a light background (not dark)
        expect(bgColor).not.toBe('rgb(17, 18, 20)'); // Not iron-950
        break;
      }
    }
  });
});

test.describe('Mobile Navigation', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('mobile nav is visible on small screens', async ({ page }) => {
    await page.goto('/');
    
    // Bottom navigation should be visible on mobile
    const mobileNav = page.locator('nav').filter({ has: page.locator('[class*="fixed bottom"]') });
    // Or check for the nav items in mobile format
    const homeIcon = page.locator('a[href="/"]').filter({ has: page.locator('svg') });
    
    await expect(homeIcon.first()).toBeVisible();
  });

  test('mobile nav links work', async ({ page }) => {
    await page.goto('/');
    
    // Click tasks link in mobile nav
    const tasksLink = page.locator('a[href="/tasks"]').first();
    await tasksLink.click();
    await expect(page).toHaveURL('/tasks');
  });
});
