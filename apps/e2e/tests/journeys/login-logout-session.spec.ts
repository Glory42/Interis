import { expect, test, type Page } from "@playwright/test";
import { buildTestUser, deleteTestUser, registerUser } from "../support/register-user";

// ProfileMenu opens on hover (onMouseEnter) as well as toggling on click -
// a plain .click() hovers first (opening it) then the click's own toggle
// immediately closes it again. Hovering alone opens it without that
// double-toggle.
const signOut = async (page: Page) => {
  await page.getByRole("button", { name: "Open profile menu" }).hover();
  await page.getByRole("button", { name: "Sign out" }).click();
};

// exact: true throughout - TanStack Router Devtools (dev-mode only) renders
// per-route buttons like "Open match details for /_authLayout/forgot-
// password", which a non-exact getByLabel("Password") can match as a
// substring depending on mount timing (same class of flakiness fixed in
// register-user.ts's Username field).
const fillLoginForm = async (page: Page, email: string, password: string) => {
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
};

test("logs out, signs back in, and stays authenticated across a reload", async ({ page }) => {
  const user = buildTestUser("e2ef");

  try {
    await test.step("sign up (auto-authenticated)", async () => {
      await registerUser(page, user);
      await expect(page.getByRole("button", { name: "Open profile menu" })).toBeVisible();
    });

    await test.step("sign out", async () => {
      await signOut(page);
      await expect(page.getByRole("link", { name: "LOGIN" })).toBeVisible({ timeout: 10_000 });
      await expect(page.getByRole("button", { name: "Open profile menu" })).not.toBeVisible();
    });

    await test.step("sign back in with the same credentials", async () => {
      await page.goto("/login");
      await fillLoginForm(page, user.email, user.password);
      await page.getByRole("button", { name: "Sign in" }).click();
      await page.waitForURL("/");
      await expect(page.getByRole("button", { name: "Open profile menu" })).toBeVisible({
        timeout: 10_000,
      });
    });

    await test.step("the session survives a full page reload", async () => {
      await page.reload();
      await expect(page.getByRole("button", { name: "Open profile menu" })).toBeVisible({
        timeout: 10_000,
      });
      await expect(page.getByRole("link", { name: "LOGIN" })).not.toBeVisible();
    });

    await test.step("rejects the wrong password", async () => {
      await signOut(page);
      await expect(page.getByRole("link", { name: "LOGIN" })).toBeVisible({ timeout: 10_000 });

      await page.goto("/login");
      await fillLoginForm(page, user.email, "the-wrong-password");
      await page.getByRole("button", { name: "Sign in" }).click();
      await expect(page.getByRole("alert")).toBeVisible({ timeout: 10_000 });
      await expect(page.getByRole("button", { name: "Open profile menu" })).not.toBeVisible();

      // Sign back in for real so cleanup below has an authenticated
      // session to delete the account with.
      await page.getByLabel("Password", { exact: true }).fill(user.password);
      await page.getByRole("button", { name: "Sign in" }).click();
      await page.waitForURL("/");
    });
  } finally {
    await deleteTestUser(page);
  }
});
