import { expect, test } from "@playwright/test";
import { buildTestUser, deleteTestUser, registerUser } from "../support/register-user";

const KNOWN_MOVIE_TMDB_ID = 550; // Fight Club
const KNOWN_MOVIE_TITLE = "Fight Club";
const REVIEW_TEXT = "A visceral, unforgettable descent into anti-consumerist mania.";
const EDITED_REVIEW_TEXT = "Edited: still one of the most quotable films ever made.";
const COMMENT_TEXT = "Completely agree, the twist still holds up.";
const EDITED_COMMENT_TEXT = "Completely agree, the twist still holds up on rewatch.";

test("writes a review, then views/comments/edits it from its detail page and the feed", async ({
  page,
}) => {
  const user = buildTestUser("e2ei");

  try {
    await test.step("sign up and log the film with a review", async () => {
      await registerUser(page, user);
      await page.goto(`/cinema/${KNOWN_MOVIE_TMDB_ID}`);
      await expect(page.getByRole("heading", { name: KNOWN_MOVIE_TITLE })).toBeVisible({
        timeout: 15_000,
      });

      await page.getByRole("button", { name: "Log", exact: true }).click();
      await expect(page.getByRole("dialog")).toBeVisible({ timeout: 10_000 });
      await page.getByPlaceholder("Share your thoughts about this film...").fill(REVIEW_TEXT);
      await page.getByRole("button", { name: "Post Review" }).click();
      await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 10_000 });
    });

    await test.step("the review shows up on the profile reviews tab and its own detail page", async () => {
      await page.goto(`/profile/${user.username}/reviews`);
      // ProfileReviewsPage.tsx also renders a poster-thumbnail link to
      // /cinema/$tmdbId right before the title link, whose accessible name
      // ("Fight Club poster", from the img alt) matches a loose
      // name-based regex just as well as the real title link - scoping to
      // href*="/reviews/" targets only the links that actually lead to
      // the review detail page.
      const reviewLink = page
        .locator('a[href*="/reviews/"]', { hasText: KNOWN_MOVIE_TITLE })
        .first();
      await expect(reviewLink).toBeVisible({ timeout: 10_000 });
      await reviewLink.click();

      await page.waitForURL(/\/reviews\/.+\/.+$/);
      await expect(page.getByText(REVIEW_TEXT)).toBeVisible({ timeout: 10_000 });
    });

    // Only one comment ever exists at a time in this test, so scoping to
    // the sole <article> on the page (comments are the only thing on the
    // review detail page rendered as <article>) is simpler and more
    // stable than filtering by in-flux text content.
    const commentArticle = page.locator("article").first();

    await test.step("adds a comment", async () => {
      await page.getByPlaceholder("Write a comment...").fill(COMMENT_TEXT);
      await page.getByRole("button", { name: "Add Comment" }).click();
      await expect(commentArticle.getByText(COMMENT_TEXT)).toBeVisible({ timeout: 10_000 });
    });

    await test.step("edits the comment", async () => {
      await commentArticle.getByRole("button", { name: "Edit comment" }).click();
      await commentArticle.getByRole("textbox").fill(EDITED_COMMENT_TEXT);
      await commentArticle.getByRole("button", { name: "Save" }).click();
      await expect(commentArticle.getByText(EDITED_COMMENT_TEXT)).toBeVisible({ timeout: 10_000 });
    });

    await test.step("deletes the comment", async () => {
      await commentArticle.getByRole("button", { name: "Delete comment" }).click();
      await expect(page.getByRole("heading", { name: "Delete this comment?" })).toBeVisible({
        timeout: 10_000,
      });
      await page.getByRole("button", { name: "Delete", exact: true }).click();
      await expect(page.getByText("No comments yet.")).toBeVisible({ timeout: 10_000 });
    });

    await test.step("edits the review itself from the feed", async () => {
      await page.goto("/");
      await expect(page.getByText(REVIEW_TEXT).first()).toBeVisible({ timeout: 10_000 });

      await page.getByRole("button", { name: "Edit", exact: true }).click();
      // FeedReviewEditDialog is built on this app's custom modal pattern
      // (ModalShell), which - unlike LogMediaDialog - never sets
      // role="dialog" on its container, so getByRole("dialog") matches
      // nothing here. ModalHeader's title is also a <p>, not a heading.
      // Scope to the <section> containing the title text instead.
      const editDialog = page.locator("section", { hasText: "EDIT REVIEW" });
      await expect(editDialog).toBeVisible({ timeout: 10_000 });

      await editDialog.getByRole("textbox").fill(EDITED_REVIEW_TEXT);
      await editDialog.getByRole("button", { name: "save", exact: true }).click();
      await expect(editDialog).not.toBeVisible({ timeout: 10_000 });
      await expect(page.getByText(EDITED_REVIEW_TEXT).first()).toBeVisible({ timeout: 10_000 });
    });

    await test.step("the edited content is reflected on the review detail page", async () => {
      await page.goto(`/profile/${user.username}/reviews`);
      await page
        .locator('a[href*="/reviews/"]', { hasText: KNOWN_MOVIE_TITLE })
        .first()
        .click();
      await page.waitForURL(/\/reviews\/.+\/.+$/);
      await expect(page.getByText(EDITED_REVIEW_TEXT)).toBeVisible({ timeout: 10_000 });
      await expect(page.getByText(REVIEW_TEXT, { exact: true })).not.toBeVisible();
    });
  } finally {
    await deleteTestUser(page);
  }
});
