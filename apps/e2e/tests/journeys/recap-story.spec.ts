import { expect, test } from "@playwright/test";
import { buildTestUser, deleteTestUser, registerUser } from "../support/register-user";

const KNOWN_MOVIE_TMDB_ID = 550;
const KNOWN_MOVIE_TITLE = "Fight Club";

test("owner opens the recap from stats, advances the deck, and exits", async ({ page }) => {
  const user = buildTestUser("e2erc");

  try {
    await registerUser(page, user);

    await test.step("log a film so the year has a recap", async () => {
      await page.goto(`/movies/${KNOWN_MOVIE_TMDB_ID}`);
      await expect(page.getByRole("heading", { name: KNOWN_MOVIE_TITLE })).toBeVisible({
        timeout: 15_000,
      });
      await page.getByRole("button", { name: "Log", exact: true }).click();
      await page.getByRole("button", { name: "Save log" }).click();
      await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 10_000 });
    });

    await test.step("open the story from the stats recap card", async () => {
      await page.goto(`/profile/${user.username}/stats`);
      await page.getByRole("link", { name: /Your \d{4} recap/ }).click();
      await expect(page).toHaveURL(new RegExp(`/recap/${user.username}/\\d{4}`));
      await expect(page.getByRole("heading", { name: "A short film" })).toBeVisible({
        timeout: 15_000,
      });
    });

    await test.step("auto-advance from Begin and exit back to stats", async () => {
      await page.getByRole("button", { name: "Begin" }).click();
      await expect(page.getByText("hours", { exact: true })).toBeVisible();
      await expect(page.getByRole("heading", { name: "The year in titles." })).toBeVisible({
        timeout: 12_000,
      });
      await page.getByRole("button", { name: "Mute the recap music" }).click();
      await expect(page.getByRole("button", { name: "Unmute the recap music" })).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(page).toHaveURL(new RegExp(`/profile/${user.username}/stats`));
    });
  } finally {
    await deleteTestUser(page).catch(() => undefined);
  }
});
