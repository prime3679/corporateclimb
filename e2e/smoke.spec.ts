import { test, expect } from '@playwright/test';

/**
 * Smoke test: Daily Challenge end-to-end flow.
 *
 * Flow:
 *   Title Screen -> Daily Challenge -> Daily Pre-Screen -> Begin Challenge
 *   -> Floor Intro (click to proceed) -> Battle Screen (verify UI)
 *   -> optionally open Items panel and use first item
 */
test('daily challenge smoke', async ({ page }) => {
  // Load the app and wipe localStorage so daily is never marked as already-played.
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  // ── Title Screen ────────────────────────────────────────────────────────────
  await expect(page.getByRole('button', { name: 'DAILY CHALLENGE' })).toBeVisible({
    timeout: 15_000,
  });
  await page.getByRole('button', { name: 'DAILY CHALLENGE' }).click();

  // ── Daily Pre-Screen ─────────────────────────────────────────────────────────
  // "BEGIN CHALLENGE" is always visible when daily hasn't been played yet.
  await expect(page.getByRole('button', { name: 'BEGIN CHALLENGE' })).toBeVisible({
    timeout: 8_000,
  });
  await page.getByRole('button', { name: 'BEGIN CHALLENGE' }).click();

  // ── Floor Intro ──────────────────────────────────────────────────────────────
  // The entire FloorIntro screen is a click-to-proceed target. Wait for the
  // "TAP TO BATTLE" hint to appear in the DOM (opacity transitions in, but the
  // node is attached right away), then click the root container to fire onReady.
  await expect(page.getByText('TAP TO BATTLE')).toBeVisible({ timeout: 10_000 });
  await page.locator('#root').click();

  // ── Battle Screen ────────────────────────────────────────────────────────────
  const fightTab = page.getByRole('button', { name: 'FIGHT' });
  const itemsTab = page.getByRole('button', { name: /ITEMS/ });

  await expect(fightTab).toBeVisible({ timeout: 10_000 });
  await expect(itemsTab).toBeVisible();

  // ── Optional: use an item if one is available ─────────────────────────────────
  // The ITEMS tab button shows a numeric badge when inventory.length > 0.
  const itemsTabText = (await itemsTab.textContent()) ?? '';
  const badgeMatch = itemsTabText.match(/(\d+)/);
  const inventoryCount = badgeMatch ? parseInt(badgeMatch[1], 10) : 0;

  if (inventoryCount > 0) {
    await itemsTab.click();

    // After switching to items mode the grid shows item buttons (not FIGHT/ITEMS tabs).
    const firstItemBtn = page
      .getByRole('button')
      .filter({ hasNotText: /^FIGHT$/ })
      .filter({ hasNotText: /^ITEMS/ })
      .first();

    await expect(firstItemBtn).toBeVisible({ timeout: 5_000 });
    await firstItemBtn.click();
  }
});
