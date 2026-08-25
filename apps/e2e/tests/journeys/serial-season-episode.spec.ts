import { expect, test } from "@playwright/test";
import { buildTestUser, deleteTestUser, registerUser } from "../support/register-user";

// Breaking Bad - long-ended (5 seasons, no new episodes will ever be
// appended), same "stable, well-known" rationale as Fight Club (550) for
// the movie journeys.
const KNOWN_SERIES_TMDB_ID = 1396;
const KNOWN_SERIES_TITLE = "Breaking Bad";
const SEASON_REVIEW_TEXT = "Great season, the tension never lets up.";

test("toggles episode/season/series watch state and rating, and writes a season review", async ({
  page,
}) => {
  const user = buildTestUser("e2ej");

  try {
    await test.step("sign up and open the series page", async () => {
      await registerUser(page, user);
      await page.goto(`/serials/${KNOWN_SERIES_TMDB_ID}`);
      await expect(page.getByRole("heading", { name: KNOWN_SERIES_TITLE })).toBeVisible({
        timeout: 15_000,
      });
    });

    // SeasonHeaderRow renders every season's own <button> unconditionally
    // (not just the open one); scoping to the button whose text contains
    // "Season 1" isolates just that row's controls from every other
    // season's identical-looking watched/like/rating/review buttons.
    const season1Row = page.locator("button").filter({ hasText: "Season 1" }).first();

    await test.step("expands season 1", async () => {
      await page.getByText("Season 1", { exact: true }).first().click();
      // Episodes render inside <article> elements once the season detail
      // query resolves - nothing else on this page uses <article>.
      await expect(page.locator("article").first()).toBeVisible({ timeout: 10_000 });
    });

    // Toggle the episode and season - and write the season review - before
    // ever touching the series-level "Watch" toggle below: that cascades
    // watched=true down to every season and episode (see
    // serials-activity.service.ts's cascadeSeasonsWatched /
    // serials-tracking.service.ts's syncSeasonWatchedFromEpisodes), which
    // would make an "Unwatched" -> click -> "Watched" assertion here a
    // false positive (already watched by the cascade, not by this click).
    const episode1 = page.locator("article").first();

    await test.step("toggles episode 1 watched and sets its rating", async () => {
      await episode1.getByRole("button", { name: "Unwatched" }).click();
      await expect(episode1.getByRole("button", { name: "Watched", exact: true })).toBeVisible({
        timeout: 10_000,
      });

      const episodeSelect = episode1.locator("select");
      await episodeSelect.selectOption("9");
      await expect(episodeSelect).toHaveValue("9", { timeout: 10_000 });
    });

    await test.step("toggles season 1 watched and sets its rating", async () => {
      await season1Row.getByRole("button", { name: "Unwatched" }).click();
      await expect(season1Row.getByRole("button", { name: "Watched", exact: true })).toBeVisible({
        timeout: 10_000,
      });

      const seasonSelect = season1Row.locator("select");
      await seasonSelect.selectOption("8");
      await expect(seasonSelect).toHaveValue("8", { timeout: 10_000 });
    });

    await test.step("writes a season review", async () => {
      await season1Row.getByRole("button", { name: "Review", exact: true }).click();

      // LogMediaDialog sets role="dialog" (unlike the feed's review-edit
      // dialog built on the plain ModalShell pattern) - but it embeds its
      // own SpaceRatingInput, which shares the sidebar's generic
      // "Rating out of 10" aria-label. Scoping to the dialog picks the
      // modal's own slider, not the still-mounted sidebar's.
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible({ timeout: 10_000 });
      await expect(dialog.getByRole("slider", { name: "Rating out of 10" })).toHaveCount(1);

      await page
        .getByPlaceholder("Share your thoughts about this season...")
        .fill(SEASON_REVIEW_TEXT);
      // The dialog also contains a separate, disabled "Save" button
      // belonging to the embedded rating widget's own (non-autoSave)
      // controls - scope to the dialog's real submit button.
      await dialog.getByRole("button", { name: "Save", exact: true }).click();
      await expect(dialog).not.toBeVisible({ timeout: 10_000 });

      await expect(season1Row.getByRole("button", { name: "Edit Review" })).toBeVisible({
        timeout: 10_000,
      });
    });

    // Unlike the movie cinema page, this page also has per-season and
    // per-episode "Watched"/"Unwatched" buttons and its own rating
    // slider inherited from the season-review modal pattern - scoping to
    // the sidebar's <aside> (complementary landmark) keeps these
    // assertions from colliding with season/episode rows, both by
    // "Watched" being a substring of "Unwatched" and because clicking
    // series-level "Watch" below cascades watched=true down to every
    // season and episode too, so plain page-wide queries become
    // ambiguous the moment that cascade lands.
    const sidebar = page.getByRole("complementary").first();

    await test.step("toggles series-level watchlist", async () => {
      await sidebar.getByRole("button", { name: "watchlist" }).click();
      await expect(sidebar.getByRole("button", { name: "watchlisted" })).toBeVisible({
        timeout: 10_000,
      });
    });

    await test.step("the series shows up on the watchlist profile tab", async () => {
      await page.goto(`/profile/${user.username}/watchlist`);
      await expect(page.getByText(KNOWN_SERIES_TITLE).first()).toBeVisible({ timeout: 10_000 });

      await page.goto(`/serials/${KNOWN_SERIES_TMDB_ID}`);
      await expect(sidebar.getByRole("button", { name: "watchlisted" })).toBeVisible({
        timeout: 10_000,
      });
    });

    // Marking watched auto-clears watchlisted (see MediaInteractions /
    // interaction-state-rules.helper.ts) - watching, liking, or rating
    // something means it's no longer "to watch".
    await test.step("toggles series-level watch, like, and rating - watching clears the watchlist", async () => {
      await sidebar.getByRole("button", { name: "Watch", exact: true }).click();
      await expect(sidebar.getByRole("button", { name: "Watched", exact: true })).toBeVisible({
        timeout: 10_000,
      });
      await expect(sidebar.getByRole("button", { name: "watchlist", exact: true })).toBeVisible({
        timeout: 10_000,
      });

      await sidebar.getByRole("button", { name: "Like", exact: true }).click();
      await expect(sidebar.getByRole("button", { name: "Liked" })).toBeVisible({ timeout: 10_000 });

      // Same gotcha as the movie interactions journey: the sidebar's
      // rating slider shares its disabled state with the mutation these
      // three buttons above just used, and the button labels flip
      // optimistically before that mutation's network round-trip
      // settles - wait for it to re-enable before interacting.
      const slider = sidebar.getByRole("slider", { name: "Rating out of 10" });
      await expect(slider).toHaveAttribute("tabindex", "0", { timeout: 10_000 });
      await slider.click({ position: { x: 12, y: 32 } });
      await expect(slider).toHaveAttribute("aria-valuenow", "8", { timeout: 10_000 });
    });

    await test.step("the series shows up on the liked profile tab, but not the watchlist tab anymore", async () => {
      await page.goto(`/profile/${user.username}/watchlist`);
      await expect(page.getByText(KNOWN_SERIES_TITLE)).toHaveCount(0, { timeout: 10_000 });

      await page.goto(`/profile/${user.username}/liked`);
      await expect(page.getByText(KNOWN_SERIES_TITLE).first()).toBeVisible({ timeout: 10_000 });
    });
  } finally {
    await deleteTestUser(page);
  }
});
