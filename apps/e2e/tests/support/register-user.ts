import type { Page } from "@playwright/test";

export type TestUser = {
  username: string;
  email: string;
  password: string;
};

export const buildTestUser = (prefix: string): TestUser => {
  const seed = `${Date.now()}${Math.floor(Math.random() * 10_000)}`.slice(-10);
  const username = `${prefix}${seed}`.toLowerCase().slice(0, 20);

  return {
    username,
    email: `${username}@example.com`,
    password: "password1234",
  };
};

// Registers a fresh account through the real UI (not an API shortcut) so
// this exercises the actual signup form end to end. Every new account is
// then forced through the mandatory security-question setup step before
// landing on "/" — complete that here too so callers get a fully usable
// session, same as a real user would.
export const registerUser = async (page: Page, user: TestUser): Promise<void> => {
  await page.goto("/register");
  await page.getByLabel("Username").fill(user.username);
  await page.getByLabel("Email").fill(user.email);
  await page.getByLabel("Password", { exact: true }).fill(user.password);
  await page.getByLabel("Confirm password").fill(user.password);
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL("/setup-security-question");

  await page.getByLabel("Your question").fill("What is this test account's favorite film?");
  await page.getByLabel("Your answer").fill("e2e-test-answer");
  await page.getByRole("button", { name: "Save and continue" }).click();
  await page.waitForURL("/");
};

// Deletes the account currently signed in on `page` via the real
// delete-account endpoint, using page.request so it rides the same session
// cookies as the browser context. Keeps e2e runs from permanently inflating
// TOTAL_USERS on every run — call this at the end of every journey that
// registers a test account.
export const deleteTestUser = async (page: Page): Promise<void> => {
  await page.request.delete("/api/auth/account");
};
