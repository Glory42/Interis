import { expect, test } from "@playwright/test";
import { buildTestUser, deleteTestUser, registerUser } from "../support/register-user";

const POST_CONTENT = "e2e-unfollow-mute-target-post";

test("follows then unfollows a user, and mutes/unmutes their activity from the feed", async ({
  browser,
}) => {
  const author = buildTestUser("e2ep");
  const viewer = buildTestUser("e2eq");

  const contextA = await browser.newContext();
  const pageA = await contextA.newPage();
  const contextB = await browser.newContext();
  const pageB = await contextB.newPage();

  try {
    await test.step("both sign up, viewer follows author", async () => {
      await registerUser(pageA, author);
      await registerUser(pageB, viewer);

      await pageB.goto(`/profile/${author.username}`);
      await pageB.getByRole("button", { name: "Follow user" }).click();
      await expect(pageB.getByRole("button", { name: "Follow user" })).toHaveText("Following", {
        timeout: 10_000,
      });
    });

    await test.step("author posts, and it shows up in the viewer's feed", async () => {
      await pageA.getByPlaceholder("Log a thought…").fill(POST_CONTENT);
      await pageA.getByPlaceholder("Log a thought…").press("Enter");
      await expect(pageA.getByText(POST_CONTENT)).toBeVisible({ timeout: 10_000 });

      await pageB.goto("/");
      await expect(pageB.getByText(POST_CONTENT).first()).toBeVisible({ timeout: 10_000 });
    });

    await test.step("viewer mutes the author and their post disappears from the feed", async () => {
      await pageB.goto(`/profile/${author.username}`);
      await pageB.getByRole("button", { name: "Mute user" }).click();
      await expect(pageB.getByRole("button", { name: "Unmute user" })).toHaveText("Muted", {
        timeout: 10_000,
      });

      await pageB.goto("/");
      await expect(pageB.getByText(POST_CONTENT)).not.toBeVisible({ timeout: 10_000 });
    });

    await test.step("viewer unmutes from settings and the post reappears", async () => {
      await pageB.goto("/settings/blocked");
      const mutedRow = pageB.locator("li", { hasText: author.username });
      await expect(mutedRow).toBeVisible({ timeout: 10_000 });
      await mutedRow.getByRole("button", { name: "Unmute" }).click();
      await expect(pageB.getByText("You haven't muted anyone.")).toBeVisible({ timeout: 10_000 });

      await pageB.goto("/");
      await expect(pageB.getByText(POST_CONTENT).first()).toBeVisible({ timeout: 10_000 });
    });

    await test.step("viewer unfollows the author", async () => {
      await pageB.goto(`/profile/${author.username}`);
      await pageB.getByRole("button", { name: "Follow user" }).click();
      await expect(pageB.getByRole("button", { name: "Follow user" })).toHaveText("Follow", {
        timeout: 10_000,
      });

      await pageB.goto("/");
      await expect(pageB.getByText(POST_CONTENT)).not.toBeVisible({ timeout: 10_000 });
    });
  } finally {
    await Promise.allSettled([deleteTestUser(pageA), deleteTestUser(pageB)]);
    await contextA.close();
    await contextB.close();
  }
});
