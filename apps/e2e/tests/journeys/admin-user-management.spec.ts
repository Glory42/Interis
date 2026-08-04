import { expect, test } from "@playwright/test";
import { buildTestUser, deleteTestUser, registerUser } from "../support/register-user";
import { promoteToAdmin } from "../support/promote-admin";

test("an admin suspends, promotes, resets the password of, and deletes a user", async ({
  browser,
}) => {
  const admin = buildTestUser("e2eu");
  const target = buildTestUser("e2ev");

  const adminContext = await browser.newContext();
  const adminPage = await adminContext.newPage();

  try {
    await test.step("target user signs up (registration-only, managed by the admin below)", async () => {
      const targetContext = await browser.newContext();
      const targetPage = await targetContext.newPage();
      await registerUser(targetPage, target);
      await targetContext.close();
    });

    await test.step("admin signs up and is promoted", async () => {
      await registerUser(adminPage, admin);
      promoteToAdmin(admin.username);
    });

    await test.step("opens the admin Users panel and finds the target", async () => {
      await adminPage.goto("/admin/");
      await adminPage.getByRole("button", { name: "Users", exact: true }).click();
      await adminPage
        .getByPlaceholder("Search by username...")
        .fill(target.username);
      await expect(adminPage.getByRole("row", { name: new RegExp(target.username) })).toBeVisible(
        { timeout: 10_000 },
      );
    });

    const targetRow = adminPage.getByRole("row", { name: new RegExp(target.username) });

    await test.step("suspends then unsuspends the target", async () => {
      await targetRow.getByRole("button", { name: "Suspend", exact: true }).click();
      const suspendDialog = adminPage.locator("section.theme-modal-panel", {
        hasText: "Suspend account",
      });
      await expect(suspendDialog).toBeVisible({ timeout: 10_000 });
      await suspendDialog.getByRole("button", { name: "Suspend", exact: true }).click();
      await expect(suspendDialog).not.toBeVisible({ timeout: 10_000 });
      await expect(targetRow.getByText("Suspended")).toBeVisible({ timeout: 10_000 });

      await targetRow.getByRole("button", { name: "Unsuspend", exact: true }).click();
      const unsuspendDialog = adminPage.locator("section.theme-modal-panel", {
        hasText: "Unsuspend account",
      });
      await expect(unsuspendDialog).toBeVisible({ timeout: 10_000 });
      await unsuspendDialog.getByRole("button", { name: "Unsuspend", exact: true }).click();
      await expect(unsuspendDialog).not.toBeVisible({ timeout: 10_000 });
      await expect(targetRow.getByText("Suspended")).not.toBeVisible({ timeout: 10_000 });
    });

    await test.step("promotes then demotes the target", async () => {
      await targetRow.getByRole("button", { name: "Promote", exact: true }).click();
      const promoteDialog = adminPage.locator("section.theme-modal-panel", {
        hasText: "Grant admin access",
      });
      await expect(promoteDialog).toBeVisible({ timeout: 10_000 });
      await promoteDialog.getByRole("button", { name: "Promote", exact: true }).click();
      await expect(promoteDialog).not.toBeVisible({ timeout: 10_000 });
      await expect(targetRow.getByText("Admin", { exact: true })).toBeVisible({
        timeout: 10_000,
      });

      await targetRow.getByRole("button", { name: "Demote", exact: true }).click();
      const demoteDialog = adminPage.locator("section.theme-modal-panel", {
        hasText: "Remove admin access",
      });
      await expect(demoteDialog).toBeVisible({ timeout: 10_000 });
      await demoteDialog.getByRole("button", { name: "Demote", exact: true }).click();
      await expect(demoteDialog).not.toBeVisible({ timeout: 10_000 });
      await expect(targetRow.getByText("Admin", { exact: true })).not.toBeVisible({
        timeout: 10_000,
      });
    });

    await test.step("resets the target's password", async () => {
      await targetRow.getByRole("button", { name: "Reset password", exact: true }).click();
      const resetDialog = adminPage.locator("section.theme-modal-panel", {
        hasText: "Reset password",
      });
      await expect(resetDialog).toBeVisible({ timeout: 10_000 });
      await resetDialog.getByPlaceholder("New password").fill("admin-reset-password-9999");
      await resetDialog.getByRole("button", { name: "Reset password", exact: true }).click();
      await expect(resetDialog).not.toBeVisible({ timeout: 10_000 });
    });

    await test.step("deletes the target account", async () => {
      await targetRow.getByRole("button", { name: "Delete", exact: true }).click();
      const deleteDialog = adminPage.locator("section.theme-modal-panel", {
        hasText: "Delete account",
      });
      await expect(deleteDialog).toBeVisible({ timeout: 10_000 });
      await deleteDialog.getByPlaceholder(target.username).fill(target.username);
      await deleteDialog.getByRole("button", { name: "Delete", exact: true }).click();
      await expect(deleteDialog).not.toBeVisible({ timeout: 10_000 });
      await expect(targetRow).not.toBeVisible({ timeout: 10_000 });
    });
  } finally {
    await deleteTestUser(adminPage);
    await adminContext.close();
  }
});
