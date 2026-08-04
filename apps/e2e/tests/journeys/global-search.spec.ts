import { expect, test } from "@playwright/test";
import { buildTestUser, deleteTestUser, registerUser } from "../support/register-user";

const KNOWN_MOVIE_TITLE = "Fight Club";
const KNOWN_SERIES_TITLE = "Breaking Bad";

test("searches for a movie and a series and navigates to each from the results", async ({
  page,
}) => {
  const user = buildTestUser("e2ek");

  try {
    await test.step("sign up", async () => {
      await registerUser(page, user);
    });

    const openSearch = async () => {
      await page.getByRole("textbox", { name: "Open global search" }).click();
      await expect(page.getByRole("dialog")).toBeVisible({ timeout: 10_000 });
    };

    const searchInput = () =>
      page.getByRole("dialog").getByPlaceholder("Search users, cinema, serials...");

    await test.step("shows a hint below the minimum query length", async () => {
      await openSearch();
      await searchInput().fill("F");
      await expect(page.getByText("Type at least 2 characters to search.")).toBeVisible({
        timeout: 10_000,
      });
      await page.keyboard.press("Escape");
      await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 10_000 });
    });

    await test.step("finds a movie and navigates to its cinema page", async () => {
      await openSearch();
      await searchInput().fill(KNOWN_MOVIE_TITLE);

      // Real TMDB data has near-duplicate/spin-off titles that also
      // substring- or prefix-match the query (e.g. "Zombie Fight Club"),
      // so name-based matching isn't reliable here - the best relevance
      // match is always the first, pre-selected option in the listbox
      // (aria-selected="true", used for Enter-to-navigate keyboard nav).
      const movieResult = page.getByRole("listbox").getByRole("option").first();
      await expect(movieResult).toBeVisible({ timeout: 10_000 });
      await movieResult.click();

      await expect(page).toHaveURL(/\/cinema\/550$/, { timeout: 10_000 });
      await expect(page.getByRole("heading", { name: KNOWN_MOVIE_TITLE })).toBeVisible({
        timeout: 10_000,
      });
    });

    await test.step("finds a series and navigates to its serial page", async () => {
      await openSearch();
      await searchInput().fill(KNOWN_SERIES_TITLE);

      const seriesResult = page.getByRole("listbox").getByRole("option").first();
      await expect(seriesResult).toBeVisible({ timeout: 10_000 });
      await seriesResult.click();

      await expect(page).toHaveURL(/\/serials\/1396$/, { timeout: 10_000 });
      await expect(page.getByRole("heading", { name: KNOWN_SERIES_TITLE })).toBeVisible({
        timeout: 10_000,
      });
    });

    await test.step("shows a no-results state for a nonsense query", async () => {
      await openSearch();
      await searchInput().fill("zzqxnonexistentquery123");
      await expect(
        page.getByText("No matches found across users, movies, and TV shows."),
      ).toBeVisible({ timeout: 10_000 });
      await page.keyboard.press("Escape");
    });
  } finally {
    await deleteTestUser(page);
  }
});
