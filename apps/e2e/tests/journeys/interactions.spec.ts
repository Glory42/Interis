import { expect, test } from "@playwright/test";
import { buildTestUser, deleteTestUser, registerUser } from "../support/register-user";

const KNOWN_MOVIE_TMDB_ID = 550; // Fight Club
const KNOWN_MOVIE_TITLE = "Fight Club";

test("toggling watchlist/watch/like/rating on a film reflects on the profile tabs", async ({
  page,
}) => {
  const user = buildTestUser("e2eh");

  try {
    await test.step("sign up and open the film page", async () => {
      await registerUser(page, user);
      await page.goto(`/cinema/${KNOWN_MOVIE_TMDB_ID}`);
      await expect(page.getByRole("heading", { name: KNOWN_MOVIE_TITLE })).toBeVisible({
        timeout: 15_000,
      });
    });

    await test.step("toggles watchlist", async () => {
      await page.getByRole("button", { name: "watchlist" }).click();
      await expect(page.getByRole("button", { name: "watchlisted" })).toBeVisible({
        timeout: 10_000,
      });
    });

    await test.step("toggles watched", async () => {
      await page.getByRole("button", { name: "Watch", exact: true }).click();
      await expect(page.getByRole("button", { name: "Watched" })).toBeVisible({
        timeout: 10_000,
      });
    });

    await test.step("toggles like", async () => {
      await page.getByRole("button", { name: "Like", exact: true }).click();
      await expect(page.getByRole("button", { name: "Liked" })).toBeVisible({ timeout: 10_000 });
    });

    await test.step("sets a rating via the slider", async () => {
      // Only one SpaceRatingInput matching this aria-label exists on this
      // page as long as it's freshly loaded (confirmed via direct DOM
      // inspection) - the sidebar's own widget.
      const slider = page.getByRole("slider", { name: "Rating out of 10" });
      // The sidebar's like/watch/watchlist buttons above share the same
      // mutation (updateInteractionMutation) that gates this slider's
      // disabled state - the button label flips to "Liked" optimistically
      // before that mutation's network round-trip actually settles, so a
      // click right after seeing "Liked" can land on a still-disabled
      // widget (tabindex="-1", where clicks silently no-op). Wait for it
      // to re-enable first.
      await expect(slider).toHaveAttribute("tabindex", "0", { timeout: 10_000 });
      // The track maps clientY linearly to a 0-10 rating (10 at the top,
      // 0 at the bottom, see SpaceRating.tsx's snapRating) - clicking at
      // 20% down a 160px-tall track lands on rating 8.
      await slider.click({ position: { x: 12, y: 32 } });
      await expect(slider).toHaveAttribute("aria-valuenow", "8", { timeout: 10_000 });
    });

    await test.step("the movie shows up on the watchlist and liked profile tabs", async () => {
      await page.goto(`/profile/${user.username}/watchlist`);
      await expect(page.getByText(KNOWN_MOVIE_TITLE).first()).toBeVisible({ timeout: 10_000 });

      await page.goto(`/profile/${user.username}/liked`);
      await expect(page.getByText(KNOWN_MOVIE_TITLE).first()).toBeVisible({ timeout: 10_000 });
    });

    await test.step("un-toggles watchlist and like", async () => {
      await page.goto(`/cinema/${KNOWN_MOVIE_TMDB_ID}`);
      await expect(page.getByRole("button", { name: "watchlisted" })).toBeVisible({
        timeout: 10_000,
      });

      await page.getByRole("button", { name: "watchlisted" }).click();
      await expect(page.getByRole("button", { name: "watchlist", exact: true })).toBeVisible({
        timeout: 10_000,
      });

      await page.getByRole("button", { name: "Liked", exact: true }).click();
      await expect(page.getByRole("button", { name: "Like", exact: true })).toBeVisible({
        timeout: 10_000,
      });

      await page.goto(`/profile/${user.username}/watchlist`);
      await expect(page.getByText(KNOWN_MOVIE_TITLE)).toHaveCount(0, { timeout: 10_000 });
    });
  } finally {
    await deleteTestUser(page);
  }
});
