import { expect, test } from "@playwright/test";
import { buildTestUser, deleteTestUser, registerUser } from "../support/register-user";
import { promoteToAdmin } from "../support/promote-admin";

const POST_CONTENT = "e2e-report-moderation-target-post-please-flag-this";
const REPORT_DETAILS = "Reporting this for the report-moderation e2e journey.";

test("a user reports a post, an admin removes it", async ({ browser }) => {
  const author = buildTestUser("e2el");
  const reporter = buildTestUser("e2em");

  const contextA = await browser.newContext();
  const pageA = await contextA.newPage();
  const contextB = await browser.newContext();
  const pageB = await contextB.newPage();

  try {
    await test.step("author signs up and posts a quick log", async () => {
      await registerUser(pageA, author);
      await pageA.getByPlaceholder("Log a thought…").fill(POST_CONTENT);
      await pageA.getByPlaceholder("Log a thought…").press("Enter");
      await expect(pageA.getByText(POST_CONTENT)).toBeVisible({ timeout: 10_000 });
    });

    await test.step("reporter signs up, follows the author, and reports the post", async () => {
      await registerUser(pageB, reporter);
      await pageB.goto(`/profile/${author.username}`);
      await pageB.getByRole("button", { name: "Follow user" }).click();
      await expect(pageB.getByRole("button", { name: "Follow user" })).toHaveText("Following", {
        timeout: 10_000,
      });

      await pageB.goto("/");
      const postCard = pageB.locator("article", { hasText: POST_CONTENT });
      await expect(postCard).toBeVisible({ timeout: 10_000 });

      await postCard.getByRole("button", { name: "Report", exact: true }).click();
      await expect(pageB.getByText("Report post")).toBeVisible({ timeout: 10_000 });

      await pageB.getByPlaceholder("Additional details (optional)").fill(REPORT_DETAILS);
      await pageB.getByRole("button", { name: "submit report" }).click();
      await expect(
        pageB.getByText("Thanks — this has been reported for review."),
      ).toBeVisible({ timeout: 10_000 });
      await pageB.getByRole("button", { name: "Close", exact: true }).click();
    });

    await test.step("reporter is promoted to admin and resolves the report", async () => {
      promoteToAdmin(reporter.username);

      await pageB.goto("/admin/");
      await expect(pageB.getByText("Reports").first()).toBeVisible({ timeout: 10_000 });

      const reportRow = pageB.locator("article, div").filter({ hasText: POST_CONTENT }).last();
      await expect(reportRow.getByText(`reported by @${reporter.username}`)).toBeVisible({
        timeout: 10_000,
      });

      await reportRow.getByRole("button", { name: "Remove content" }).click();

      // AdminConfirmDialog is built on the same role-less ModalShell
      // pattern as the feed's review-edit dialog (see review-lifecycle.
      // spec.ts) - scope by the confirm panel's own title text instead
      // of getByRole("dialog"). A plain `section` filter also matches
      // the page's own outer content wrapper (which of course contains
      // "Remove content" too, via the button that opened this dialog),
      // so scope specifically to the modal-panel-styled section, which
      // only renders at all while the dialog is open.
      const confirmPanel = pageB.locator("section.theme-modal-panel", {
        hasText: "Remove content",
      });
      await expect(confirmPanel).toBeVisible({ timeout: 10_000 });
      await confirmPanel.getByRole("button", { name: "Remove", exact: true }).click();
      await expect(confirmPanel).not.toBeVisible({ timeout: 10_000 });

      await expect(pageB.getByText(POST_CONTENT)).not.toBeVisible({ timeout: 10_000 });
    });

    await test.step("the removed post no longer shows up in the feed", async () => {
      await pageB.goto("/");
      await expect(pageB.getByText(POST_CONTENT)).not.toBeVisible({ timeout: 10_000 });
    });
  } finally {
    await Promise.allSettled([deleteTestUser(pageA), deleteTestUser(pageB)]);
    await contextA.close();
    await contextB.close();
  }
});
