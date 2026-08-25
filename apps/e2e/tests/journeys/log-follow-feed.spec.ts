import { expect, test } from "@playwright/test";
import { buildTestUser, deleteTestUser, registerUser } from "../support/register-user";

// tmdbId 550 is Fight Club - a long-stable, well-known TMDB id, used so
// this journey doesn't depend on fragile full-text search UI interaction
// (which is exercised elsewhere) to find a movie to log.
const KNOWN_MOVIE_TMDB_ID = 550;
const KNOWN_MOVIE_TITLE = "Fight Club";

test("sign up, log a movie, get followed, and show up in the follower's feed", async ({
  browser,
}) => {
  const userA = buildTestUser("e2ea");
  const userB = buildTestUser("e2eb");

  const contextA = await browser.newContext();
  const pageA = await contextA.newPage();
  const contextB = await browser.newContext();
  const pageB = await contextB.newPage();

  try {
    await test.step("user A signs up", async () => {
      await registerUser(pageA, userA);
    });

    await test.step("user A logs a movie", async () => {
      await pageA.goto(`/cinema/${KNOWN_MOVIE_TMDB_ID}`);
      await expect(pageA.getByRole("heading", { name: KNOWN_MOVIE_TITLE })).toBeVisible({
        timeout: 15_000,
      });

      await pageA.getByRole("button", { name: "Log", exact: true }).click();
      await pageA.getByRole("button", { name: "Post Review" }).click();
      await expect(pageA.getByRole("dialog")).not.toBeVisible({ timeout: 10_000 });
    });

    await test.step("the entry shows up on user A's diary", async () => {
      await pageA.goto(`/profile/${userA.username}/diary`);
      await expect(pageA.getByText(KNOWN_MOVIE_TITLE).first()).toBeVisible({
        timeout: 10_000,
      });
    });

    await test.step("user B signs up and follows user A", async () => {
      await registerUser(pageB, userB);
      await pageB.goto(`/profile/${userA.username}`);
      await pageB.getByRole("button", { name: "Follow user" }).click();
      await expect(pageB.getByRole("button", { name: "Follow user" })).toHaveText(
        "Following",
        { timeout: 10_000 },
      );
    });

    await test.step("user A's log activity shows up in user B's feed", async () => {
      await pageB.goto("/");
      await expect(pageB.getByText(KNOWN_MOVIE_TITLE).first()).toBeVisible({
        timeout: 10_000,
      });
    });
  } finally {
    // Clean up the accounts this test created so e2e runs don't permanently
    // inflate TOTAL_USERS. Best-effort: run both even if one fails, and
    // don't let cleanup errors mask a real test failure.
    await Promise.allSettled([deleteTestUser(pageA), deleteTestUser(pageB)]);
    await contextA.close();
    await contextB.close();
  }
});
