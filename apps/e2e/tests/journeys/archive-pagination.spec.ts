import { expect, test } from "@playwright/test";

// The movie archive is backed by TMDB's real trending catalog, which
// always has comfortably more than one page's worth of results - unlike
// profile tabs (60-item page size, would need seeding 61+ diary/review/
// watchlist entries per test to ever reach "Load more"), this needs no
// signup or per-test data at all to reach and exercise a second page.
const ARCHIVE_ITEM_LINK_SELECTOR = 'a[href^="/movies/"]';
const ARCHIVE_PAGE_SIZE = 30;

// Counts are bounds, not exact: trending can repeat a title across TMDB
// pages and the archive drops repeats.
test("loads more movie archive results on demand", async ({ page }) => {
  await page.goto("/movies");

  const items = page.locator(ARCHIVE_ITEM_LINK_SELECTOR);
  await expect(items.first()).toBeVisible({ timeout: 15_000 });
  const firstPageCount = await items.count();
  expect(firstPageCount).toBeLessThanOrEqual(ARCHIVE_PAGE_SIZE);

  const showMore = page.getByRole("button", { name: "Show more" });
  await expect(showMore).toBeVisible({ timeout: 10_000 });
  await showMore.click();

  await expect
    .poll(() => items.count(), { timeout: 15_000 })
    .toBeGreaterThan(firstPageCount);
  expect(await items.count()).toBeLessThanOrEqual(ARCHIVE_PAGE_SIZE * 2);
});
