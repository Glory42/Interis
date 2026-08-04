import { expect, test } from "@playwright/test";
import { buildTestUser, deleteTestUser, registerUser } from "../support/register-user";

test("a follow generates a notification, which can be opened and marks itself read", async ({
  browser,
}) => {
  const userA = buildTestUser("e2er");
  const userB = buildTestUser("e2es");

  const contextA = await browser.newContext();
  const pageA = await contextA.newPage();
  const contextB = await browser.newContext();
  const pageB = await contextB.newPage();

  try {
    await test.step("both sign up, user B follows user A", async () => {
      await registerUser(pageA, userA);
      await registerUser(pageB, userB);

      await pageB.goto(`/profile/${userA.username}`);
      await pageB.getByRole("button", { name: "Follow user" }).click();
      await expect(pageB.getByRole("button", { name: "Follow user" })).toHaveText("Following", {
        timeout: 10_000,
      });
    });

    const bell = pageA.getByRole("button", { name: "Open notifications" });

    await test.step("user A sees an unread notification for the follow", async () => {
      // The bell badge/panel only refetch on their own polling interval or
      // remount - force a fresh load rather than waiting on that.
      await pageA.goto("/");
      await expect(bell.locator("span", { hasText: "1" })).toBeVisible({ timeout: 15_000 });

      await bell.click();
      const panel = pageA.getByRole("menu", { name: "Notifications" });
      await expect(panel).toBeVisible({ timeout: 10_000 });
      await expect(panel.getByText(`${userB.username} started following you`)).toBeVisible({
        timeout: 10_000,
      });
    });

    await test.step("clicking it navigates to the follower's profile and marks it read", async () => {
      const panel = pageA.getByRole("menu", { name: "Notifications" });
      await panel.getByText(`${userB.username} started following you`).click();

      await expect(pageA).toHaveURL(new RegExp(`/profile/${userB.username}$`), {
        timeout: 10_000,
      });

      await bell.click();
      await expect(bell.locator("span", { hasText: "1" })).not.toBeVisible({ timeout: 10_000 });
    });
  } finally {
    await Promise.allSettled([deleteTestUser(pageA), deleteTestUser(pageB)]);
    await contextA.close();
    await contextB.close();
  }
});
