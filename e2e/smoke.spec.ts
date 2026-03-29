import { test, expect } from '@playwright/test';

test.describe('Smoke test', () => {
  test('page loads with correct title and connect button', async ({ page }) => {
    await page.goto('/');
    
    await expect(page).toHaveTitle(/Stellar-Spend/i);
    
    const connectButton = page.getByRole('button', { name: /connect wallet/i });
    await expect(connectButton).toBeVisible();
  });
});
