import { test, expect } from '@playwright/test';

// Smoke test: loads the landing page, plays through the 3-track demo,
// and verifies the results screen appears.
test('landing-page demo plays through to results', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

  await page.getByRole('button', { name: /Sākt/ }).first().click();

  for (let i = 0; i < 3; i++) {
    await page.getByLabel(/Pieraksti/).fill(`answer-${i}`);
    const btn = page.getByRole('button', { name: /Nākamais|Pabeigt/ });
    await btn.click();
  }

  await expect(page.getByText('Rezultāti')).toBeVisible();
});
