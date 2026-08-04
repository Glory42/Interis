import { expect, test, type Page } from "@playwright/test";
import { buildTestUser, deleteTestUser, registerUser } from "../support/register-user";

// registerUser always sets up this exact security question/answer pair
// (see register-user.ts) - reusing it here means this journey needs no
// email interception or DB access at all: the app's "forgot password"
// flow is a security-question challenge, not an emailed token.
const SECURITY_QUESTION = "What is this test account's favorite film?";
const SECURITY_ANSWER = "e2e-test-answer";
const NEW_PASSWORD = "a-different-password-9999";

const signOut = async (page: Page) => {
  await page.getByRole("button", { name: "Open profile menu" }).hover();
  await page.getByRole("button", { name: "Sign out" }).click();
};

test("resets a forgotten password via the security question and signs in with it", async ({
  page,
}) => {
  const user = buildTestUser("e2et");

  try {
    await test.step("sign up, then sign out", async () => {
      await registerUser(page, user);
      await signOut(page);
      await expect(page.getByRole("link", { name: "LOGIN" })).toBeVisible({ timeout: 10_000 });
    });

    await test.step("looks up the account and answers the security question", async () => {
      await page.goto("/forgot-password");
      await page.getByLabel("Email", { exact: true }).fill(user.email);
      await page.getByRole("button", { name: "Continue" }).click();

      await expect(page.getByText(SECURITY_QUESTION)).toBeVisible({ timeout: 10_000 });
      await page.getByLabel("Answer", { exact: true }).fill(SECURITY_ANSWER);
      await page.getByLabel("New password", { exact: true }).fill(NEW_PASSWORD);
      await page.getByRole("button", { name: "Update password" }).click();

      await expect(page.getByRole("heading", { name: "Password updated" })).toBeVisible({
        timeout: 10_000,
      });
    });

    await test.step("signs in with the new password", async () => {
      await page.getByRole("button", { name: "Go to sign in" }).click();
      await page.waitForURL("/login");

      await page.getByLabel("Email", { exact: true }).fill(user.email);
      await page.getByLabel("Password", { exact: true }).fill(NEW_PASSWORD);
      await page.getByRole("button", { name: "Sign in" }).click();
      await page.waitForURL("/");
      await expect(page.getByRole("button", { name: "Open profile menu" })).toBeVisible({
        timeout: 10_000,
      });
    });

    await test.step("the old password no longer works", async () => {
      await signOut(page);
      await page.goto("/login");
      await page.getByLabel("Email", { exact: true }).fill(user.email);
      await page.getByLabel("Password", { exact: true }).fill(user.password);
      await page.getByRole("button", { name: "Sign in" }).click();
      await expect(page.getByRole("alert")).toBeVisible({ timeout: 10_000 });

      // Sign back in with the real (new) password so cleanup below has an
      // authenticated session to delete the account with.
      await page.getByLabel("Password", { exact: true }).fill(NEW_PASSWORD);
      await page.getByRole("button", { name: "Sign in" }).click();
      await page.waitForURL("/");
    });
  } finally {
    await deleteTestUser(page);
  }
});
