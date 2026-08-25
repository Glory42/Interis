import { expect, test } from "@playwright/test";
import { buildTestUser, deleteTestUser, registerUser } from "../support/register-user";

const LOGGED_MOVIE_TMDB_ID = 550; // Fight Club
const LOGGED_MOVIE_TITLE = "Fight Club";
const IMPORTED_MOVIE_TMDB_ID = 155; // The Dark Knight
const IMPORTED_MOVIE_TITLE = "The Dark Knight";

// Interis's own export format (apps/api/.../export.service.ts's
// EXPORT_HEADERS) is detected by the importer whenever both TmdbId and
// WatchedDate columns are present, and a non-empty TmdbId is matched
// directly - no title search/fuzzy-matching involved, so this is a
// fully deterministic fixture.
const IMPORT_FIXTURE_CSV = [
  "WatchedDate,MediaType,Title,Year,TmdbId,Rating,Rewatch,Review,Spoilers",
  `2024-02-01,movie,${IMPORTED_MOVIE_TITLE},2008,${IMPORTED_MOVIE_TMDB_ID},,false,,false`,
  "",
].join("\n");

test("exports the diary as CSV and imports a fixture back in", async ({ page }) => {
  const user = buildTestUser("e2ew");

  try {
    await test.step("sign up and log a movie so the export has content", async () => {
      await registerUser(page, user);
      await page.goto(`/cinema/${LOGGED_MOVIE_TMDB_ID}`);
      await expect(page.getByRole("heading", { name: LOGGED_MOVIE_TITLE })).toBeVisible({
        timeout: 15_000,
      });

      await page.getByRole("button", { name: "Log", exact: true }).click();
      await page.getByRole("button", { name: "Post Review" }).click();
      await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 10_000 });
    });

    await test.step("exports the diary and the download contains the logged movie", async () => {
      await page.goto("/settings/data");

      const downloadPromise = page.waitForEvent("download");
      await page.getByRole("button", { name: "Export as CSV" }).click();
      const download = await downloadPromise;

      const stream = await download.createReadStream();
      const chunks: Buffer[] = [];
      for await (const chunk of stream) {
        chunks.push(chunk as Buffer);
      }
      const csvContent = Buffer.concat(chunks).toString("utf-8");

      expect(csvContent).toContain(String(LOGGED_MOVIE_TMDB_ID));
      expect(csvContent).toContain(LOGGED_MOVIE_TITLE);
    });

    await test.step("imports a fixture CSV referencing a different movie", async () => {
      await page.setInputFiles('input[type="file"]', {
        name: "interis-import-fixture.csv",
        mimeType: "text/csv",
        buffer: Buffer.from(IMPORT_FIXTURE_CSV, "utf-8"),
      });
      await page.getByRole("button", { name: "Import", exact: true }).click();

      await expect(page.getByText("import complete")).toBeVisible({ timeout: 15_000 });
      await expect(page.getByText("Done — 1 imported · 0 skipped · 0 failed")).toBeVisible({
        timeout: 10_000,
      });

      await page.getByRole("button", { name: "Close", exact: true }).click();
    });

    await test.step("the imported movie shows up in the diary", async () => {
      await page.goto(`/profile/${user.username}/diary`);
      await expect(page.getByText(IMPORTED_MOVIE_TITLE).first()).toBeVisible({ timeout: 10_000 });
    });
  } finally {
    await deleteTestUser(page);
  }
});
