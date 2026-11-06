import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { eq } from "drizzle-orm";
import { db } from "../../../src/infrastructure/database/db";
import { activities } from "../../../src/modules/social/social.entity";
import { user } from "../../../src/infrastructure/database/auth.entity";
import { apiRequest } from "../../support/app/http-client";
import { signUpTestUser } from "../../support/app/auth-flow";
import type { CookieJar } from "../../support/app/cookie-jar";
import { seedTestMovie } from "../../support/factories/media.factory";
import { startTestServer, type RunningTestServer } from "../../support/app/test-server";

// Likes are recorded fire-and-forget, so give the inserts a moment to land.
const waitForActivityWrites = () => new Promise((resolve) => setTimeout(resolve, 200));

type GroupedEntry =
  | {
      kind: "title";
      movie: { tmdbId: number };
      watched: boolean;
      rating: number | null;
      liked: boolean;
      watchlisted: boolean;
      review: { content: string } | null;
      itemIds: string[];
    }
  | { kind: "activity"; item: { id: string } };

type GroupedPage = { items: GroupedEntry[]; nextCursor: string | null };

describe("GET /api/social/feed/grouped", () => {
  let testServer: RunningTestServer | null = null;

  const getServer = (): RunningTestServer => {
    if (!testServer) throw new Error("Test server is not running");
    return testServer;
  };

  beforeAll(async () => {
    testServer = await startTestServer();
  });

  afterAll(async () => {
    if (!testServer) return;
    await testServer.close();
    testServer = null;
  });

  const send = async (jar: CookieJar, path: string, method: string, body: unknown) => {
    const response = await apiRequest(
      getServer().baseUrl,
      path,
      { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) },
      jar,
    );
    expect(response.ok).toBe(true);
  };

  const getPage = async (jar: CookieJar, query: string): Promise<GroupedPage> => {
    const response = await apiRequest(getServer().baseUrl, `/api/social/feed/grouped?${query}`, {}, jar);
    expect(response.status).toBe(200);
    return (await response.json()) as GroupedPage;
  };

  const titleEntries = (page: GroupedPage) =>
    page.items.filter((entry): entry is Extract<GroupedEntry, { kind: "title" }> => entry.kind === "title");

  it("merges a log, rating, like and review of one title on one day into one entry", async () => {
    const { jar } = await signUpTestUser(getServer().baseUrl, "grpone");
    const movie = await seedTestMovie("Grouped Movie");

    await send(jar, "/api/diary", "POST", { tmdbId: movie.tmdbId, watchedDate: "2026-02-01", rating: 8 });
    await send(jar, `/api/interactions/${movie.tmdbId}`, "PUT", { liked: true });
    await send(jar, "/api/reviews", "POST", { tmdbId: movie.tmdbId, content: "Grouped review text" });
    await waitForActivityWrites();

    const page = await getPage(jar, "limit=20");
    const entries = titleEntries(page).filter((entry) => entry.movie.tmdbId === movie.tmdbId);

    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ watched: true, rating: 8, liked: true });
    expect(entries[0]!.review?.content).toBe("Grouped review text");
  });

  it("pages across a day boundary without splitting or repeating a group", async () => {
    const { jar, username } = await signUpTestUser(getServer().baseUrl, "grppage");
    const [userRow] = await db.select({ id: user.id }).from(user).where(eq(user.username, username));
    const [oldest, middle, newest] = await Promise.all([
      seedTestMovie("Grouped Oldest"),
      seedTestMovie("Grouped Middle"),
      seedTestMovie("Grouped Newest"),
    ]);

    for (const movie of [oldest, middle, newest]) {
      await send(jar, `/api/interactions/${movie.tmdbId}`, "PUT", { liked: true });
      await send(jar, `/api/interactions/${movie.tmdbId}`, "PUT", { watchlisted: true });
    }
    await send(jar, "/api/diary", "POST", { tmdbId: middle.tmdbId, watchedDate: "2026-01-02" });
    await waitForActivityWrites();

    // One day per title: oldest on Jan 1, middle (3 rows) on Jan 2, newest on Jan 3.
    const dayByMovieId = new Map([
      [oldest.id, "2026-01-01"],
      [middle.id, "2026-01-02"],
      [newest.id, "2026-01-03"],
    ]);
    const rows = await db.select().from(activities).where(eq(activities.userId, userRow!.id));
    const minuteByDay = new Map<string, number>();
    for (const row of rows) {
      const movieId = (JSON.parse(row.metadata ?? "{}") as { movieId?: number }).movieId;
      const day = movieId === undefined ? undefined : dayByMovieId.get(movieId);
      if (!day) continue;
      const minute = (minuteByDay.get(day) ?? 0) + 1;
      minuteByDay.set(day, minute);
      await db
        .update(activities)
        .set({ createdAt: new Date(`${day}T10:0${minute}:00Z`) })
        .where(eq(activities.id, row.id));
    }

    // limit=2 scans 4 rows: newest's 2 rows, then middle's day straddles the page.
    const seen: Extract<GroupedEntry, { kind: "title" }>[] = [];
    let cursor: string | null = null;
    for (let pageIndex = 0; pageIndex < 6; pageIndex += 1) {
      const page = await getPage(jar, `limit=2${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`);
      seen.push(...titleEntries(page));
      cursor = page.nextCursor;
      if (!cursor) break;
    }

    expect(seen.map((entry) => entry.movie.tmdbId)).toEqual([
      newest.tmdbId,
      middle.tmdbId,
      oldest.tmdbId,
    ]);
    expect(seen[1]).toMatchObject({ watched: true, liked: true, watchlisted: true });
    expect(seen[1]!.itemIds).toHaveLength(3);
  });
});
