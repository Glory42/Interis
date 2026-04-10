import { expect, test } from "@playwright/test";

test("loads home app shell", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Interis/i);
});
