import { test, expect } from '@playwright/test';

// Smoke test: plays the 3-track demo (intro → play → review → results).
test('landing-page demo plays through to results', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

  await page.getByRole('button', { name: /Sākt/ }).first().click();

  for (let i = 0; i < 3; i++) {
    await page.getByLabel(/Pieraksti/).fill(`answer-${i}`);
    const btn = page.getByRole('button', { name: /Nākamais|Pabeigt/ });
    await btn.click();
  }

  // Review phase — finalize without changing auto-grades
  await expect(page.getByRole('heading', { name: /Pārskats/ })).toBeVisible();
  await page.getByRole('button', { name: /Pabeigt/ }).click();

  await expect(page.getByRole('heading', { name: /Rezultāti/ })).toBeVisible();
});
