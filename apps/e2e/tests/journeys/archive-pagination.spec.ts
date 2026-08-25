import { expect, test } from "@playwright/test";

// The cinema archive is backed by TMDB's real trending catalog, which
// always has comfortably more than one page's worth of results - unlike
// profile tabs (60-item page size, would need seeding 61+ diary/review/
// watchlist entries per test to ever reach "Load more"), this needs no
// signup or per-test data at all to reach and exercise a second page.
const ARCHIVE_ITEM_LINK_SELECTOR = 'a[href^="/cinema/"]';
const ARCHIVE_PAGE_SIZE = 30;

test("loads more cinema archive results on demand", async ({ page }) => {
  await page.goto("/cinema");

  const items = page.locator(ARCHIVE_ITEM_LINK_SELECTOR);
  await expect(items).toHaveCount(ARCHIVE_PAGE_SIZE, { timeout: 15_000 });

  const showMore = page.getByRole("button", { name: "Show more" });
  await expect(showMore).toBeVisible({ timeout: 10_000 });
  await showMore.click();

  await expect(items).toHaveCount(ARCHIVE_PAGE_SIZE * 2, { timeout: 15_000 });
});
