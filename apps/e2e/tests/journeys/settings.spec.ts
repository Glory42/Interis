import { expect, test } from "@playwright/test";
import { buildTestUser, deleteTestUser, registerUser } from "../support/register-user";

const KNOWN_MOVIE_TITLE = "Fight Club";
const NEW_BIO = "e2e settings journey bio";
const NEW_LOCATION = "Testville, QA";

test("edits profile, theme, Top4 favorites, and manages blocked users from settings", async ({
  browser,
}) => {
  const user = buildTestUser("e2en");
  const otherUser = buildTestUser("e2eo");

  const context = await browser.newContext();
  const page = await context.newPage();
  const otherContext = await browser.newContext();
  const otherPage = await otherContext.newPage();

  try {
    await test.step("sign up", async () => {
      await registerUser(page, user);
      await registerUser(otherPage, otherUser);
    });

    await test.step("edits and saves profile bio/location", async () => {
      await page.goto("/settings/profile");
      await page.locator("#settings-bio").fill(NEW_BIO);
      await page.locator("#settings-location").fill(NEW_LOCATION);
      await page.getByRole("button", { name: "Save changes" }).click();
      await expect(page.getByText("Profile settings saved.")).toBeVisible({ timeout: 10_000 });

      await page.reload();
      await expect(page.locator("#settings-bio")).toHaveValue(NEW_BIO, { timeout: 10_000 });
      await expect(page.locator("#settings-location")).toHaveValue(NEW_LOCATION);
    });

    await test.step("switches theme and it persists across reload", async () => {
      await page.goto("/settings/theme");
      await page.getByRole("button", { name: /Tokyo Night/ }).click();
      await expect(page.getByText("Theme saved.")).toBeVisible({ timeout: 10_000 });
      await expect(page.locator("html")).toHaveAttribute("data-theme-id", "tokyo-night");

      await page.reload();
      await expect(page.locator("html")).toHaveAttribute("data-theme-id", "tokyo-night", {
        timeout: 10_000,
      });
    });

    await test.step("sets a Top4 cinema favorite", async () => {
      await page.goto("/settings/favorites");
      await page.getByRole("button", { name: "Cinema #1" }).click();

      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible({ timeout: 10_000 });
      await dialog.getByPlaceholder("Search movies for this slot...").fill(KNOWN_MOVIE_TITLE);

      // Real TMDB data can have near-duplicate titles matching the same
      // query (see global-search.spec.ts) - the best-relevance match is
      // always the first result.
      const firstResult = dialog.locator("ul li button").first();
      await expect(firstResult).toBeVisible({ timeout: 10_000 });
      await firstResult.click();

      await expect(dialog).not.toBeVisible({ timeout: 10_000 });
      await expect(page.getByRole("button", { name: new RegExp(KNOWN_MOVIE_TITLE) })).toBeVisible({
        timeout: 10_000,
      });

      await page.getByRole("button", { name: "Save favorites" }).click();
      await expect(page.getByText("Favorites saved.")).toBeVisible({ timeout: 10_000 });
    });

    await test.step("blocks another user and unblocks them from settings", async () => {
      await page.goto(`/profile/${otherUser.username}`);
      await page.getByRole("button", { name: "Block user" }).click();
      await expect(page.getByRole("button", { name: "Unblock user" })).toBeVisible({
        timeout: 10_000,
      });

      await page.goto("/settings/blocked");
      const blockedRow = page.locator("li", { hasText: otherUser.username });
      await expect(blockedRow).toBeVisible({ timeout: 10_000 });

      await blockedRow.getByRole("button", { name: "Unblock" }).click();
      await expect(page.getByText("You haven't blocked anyone.")).toBeVisible({ timeout: 10_000 });
    });
  } finally {
    await Promise.allSettled([deleteTestUser(page), deleteTestUser(otherPage)]);
    await context.close();
    await otherContext.close();
  }
});
