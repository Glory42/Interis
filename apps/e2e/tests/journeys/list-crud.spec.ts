import { expect, test } from "@playwright/test";
import { buildTestUser, deleteTestUser, registerUser } from "../support/register-user";

// A different, less-obvious stable TMDB id than Fight Club (used by the
// other journeys) so the two never collide inside the same list-item
// search dropdown if tests ever run against overlapping data.
const KNOWN_MOVIE_TITLE = "Seven";

test("creates a list, adds an item, edits it, then deletes it", async ({ page }) => {
  const user = buildTestUser("e2eg");

  try {
    await test.step("sign up", async () => {
      await registerUser(page, user);
    });

    await test.step("create a new list with one item", async () => {
      await page.goto(`/profile/${user.username}/lists`);
      await page.getByRole("button", { name: "New List" }).click();
      await page.waitForURL(`/profile/${user.username}/lists/new`);

      await page.getByPlaceholder("Give your list a name...").fill("My Favorite Thrillers");

      const searchInput = page.getByPlaceholder("Search by title...");
      await searchInput.fill(KNOWN_MOVIE_TITLE);
      await expect(page.getByRole("button", { name: new RegExp(KNOWN_MOVIE_TITLE) }).first()).toBeVisible({
        timeout: 10_000,
      });
      await page.getByRole("button", { name: new RegExp(KNOWN_MOVIE_TITLE) }).first().click();

      await page.getByRole("button", { name: "Save", exact: true }).click();
      await expect(page.getByRole("heading", { name: "My Favorite Thrillers" })).toBeVisible({
        timeout: 10_000,
      });
      await expect(page.getByText(KNOWN_MOVIE_TITLE).first()).toBeVisible();
    });

    await test.step("shows up on the public lists tab", async () => {
      await page.goto(`/profile/${user.username}/lists`);
      await expect(page.getByText("My Favorite Thrillers")).toBeVisible({ timeout: 10_000 });
    });

    await test.step("edits the title and removes the item", async () => {
      await page.getByText("My Favorite Thrillers").click();
      await page.waitForURL(/\/profile\/.+\/lists\/.+$/);
      await page.getByRole("button", { name: "Edit" }).click();
      await page.waitForURL(/\/lists\/.+\/edit$/);

      const titleInput = page.getByPlaceholder("Give your list a name...");
      await expect(titleInput).toHaveValue("My Favorite Thrillers");
      await titleInput.fill("");
      await titleInput.fill("Renamed List");

      // The item row's remove button has no accessible name (icon-only) -
      // scope to the row by its title text, then take the last of its
      // three icon buttons (move-up, move-down, remove).
      const itemRow = page.locator("li", { hasText: KNOWN_MOVIE_TITLE });
      await itemRow.locator("button").last().click();
      await expect(itemRow).not.toBeVisible({ timeout: 10_000 });

      await page.getByRole("button", { name: "Save", exact: true }).click();
      await expect(page.getByRole("heading", { name: "Renamed List" })).toBeVisible({
        timeout: 10_000,
      });
      await expect(page.getByText(KNOWN_MOVIE_TITLE)).toHaveCount(0);
    });

    await test.step("deletes the list", async () => {
      page.once("dialog", (dialog) => {
        void dialog.accept();
      });
      await page.getByRole("button", { name: "Delete" }).click();
      await page.waitForURL(`/profile/${user.username}/lists`);
      await expect(page.getByText("Renamed List")).not.toBeVisible();
    });
  } finally {
    await deleteTestUser(page);
  }
});
