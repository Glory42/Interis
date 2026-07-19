import { expect, test } from "@playwright/test";
import { buildTestUser, deleteTestUser, registerUser } from "../support/register-user";

const KNOWN_MOVIE_TMDB_ID = 550; // Fight Club
const KNOWN_MOVIE_TITLE = "Fight Club";

test("blocking a user removes their activity from your feed", async ({ browser }) => {
  const userA = buildTestUser("e2ec");
  const userB = buildTestUser("e2ed");

  const contextA = await browser.newContext();
  const pageA = await contextA.newPage();
  const contextB = await browser.newContext();
  const pageB = await contextB.newPage();

  try {
    await test.step("both users sign up, and A follows B", async () => {
      await registerUser(pageA, userA);
      await registerUser(pageB, userB);

      await pageA.goto(`/profile/${userB.username}`);
      await pageA.getByRole("button", { name: "Follow user" }).click();
      await expect(pageA.getByRole("button", { name: "Follow user" })).toHaveText(
        "Following",
        { timeout: 10_000 },
      );
    });

    await test.step("user B logs a movie", async () => {
      await pageB.goto(`/cinema/${KNOWN_MOVIE_TMDB_ID}`);
      await expect(pageB.getByRole("heading", { name: KNOWN_MOVIE_TITLE })).toBeVisible({
        timeout: 15_000,
      });
      await pageB.getByRole("button", { name: "Log", exact: true }).click();
      await pageB.getByRole("button", { name: "Post Review" }).click();
      await expect(pageB.getByRole("dialog")).not.toBeVisible({ timeout: 10_000 });
    });

    await test.step("user A's feed shows the activity before blocking", async () => {
      await pageA.goto("/");
      await expect(pageA.getByText(KNOWN_MOVIE_TITLE).first()).toBeVisible({
        timeout: 10_000,
      });
    });

    await test.step("user A blocks user B", async () => {
      await pageA.goto(`/profile/${userB.username}`);
      await pageA.getByRole("button", { name: "Block user" }).click();
      await expect(pageA.getByRole("button", { name: "Unblock user" })).toBeVisible({
        timeout: 10_000,
      });
    });

    await test.step("user B's activity no longer appears in user A's feed", async () => {
      await pageA.goto("/");
      await expect(pageA.getByText(KNOWN_MOVIE_TITLE)).toHaveCount(0, { timeout: 10_000 });
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
