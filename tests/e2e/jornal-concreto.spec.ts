import { expect, test } from '@playwright/test';

test.describe('Jornal Concreto', () => {
  test('preserva hierarquia, sublinhados e alternância de papel', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('A cidade terceirizou o relógio');
    await expect(page.locator('.hero-headline--static')).toHaveCSS('text-decoration-line', 'none');
    await expect(page.locator('.channel-card__title').first()).toHaveCSS('text-decoration-line', 'underline');

    const toggle = page.locator('[data-theme-toggle]');
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await toggle.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  });

  test('não produz overflow horizontal no viewport móvel', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    await expect(page).toHaveScreenshot('jornal-concreto-mobile.png', { fullPage: true });
  });

  test('regressão visual desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto('/');
    await expect(page).toHaveScreenshot('jornal-concreto-desktop.png', { fullPage: true });
  });
});
