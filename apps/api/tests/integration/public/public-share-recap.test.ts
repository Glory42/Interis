import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { eq } from "drizzle-orm";
import { apiRequest } from "../../support/app/http-client";
import { signUpTestUser } from "../../support/app/auth-flow";
import { startTestServer, type RunningTestServer } from "../../support/app/test-server";
import { WATCH_LOG_MEDIA, watchLogClient } from "../../support/factories/watch-log.factory";
import { db } from "../../../src/infrastructure/database/db";
import { user } from "../../../src/infrastructure/database/auth.entity";
import { films as filmTable } from "../../../src/modules/films/films.entity";
import { profiles } from "../../../src/modules/users/users.entity";

const [FILM] = WATCH_LOG_MEDIA as [(typeof WATCH_LOG_MEDIA)[0]];
const THIS_YEAR = new Date().getUTCFullYear();

describe("Year in Review link preview (/api/public/meta/recap, /api/public/og/recap)", () => {
  let testServer: RunningTestServer | null = null;
  const baseUrl = () => {
    if (!testServer) throw new Error("Test server is not running");
    return testServer.baseUrl;
  };
  const films = watchLogClient(baseUrl, FILM);

  beforeAll(async () => {
    testServer = await startTestServer();
  });

  afterAll(async () => {
    await testServer?.close();
    testServer = null;
  });

  const getMeta = async (path: string) => {
    const response = await apiRequest(baseUrl(), `/api/public/meta/recap${path}`);
    return { response, body: response.status === 200 ? ((await response.json()) as Record<string, string>) : null };
  };

  it("describes a past year with its headline numbers, a versioned card and the recap path", async () => {
    const { jar, username } = await signUpTestUser(baseUrl(), "rcmet");
    const film = await FILM.seed("Recap Meta Film");
    await db
      .update(filmTable)
      .set({ runtime: 120, director: "Ada Lens", genres: [{ id: 1, name: "Drama" }] })
      .where(eq(filmTable.id, film.id));
    await films.logId(jar, film.tmdbId, "2025-03-01");
    await films.log(jar, film.tmdbId, { watchedDate: "2025-04-01", rewatch: true });

    const { response, body } = await getMeta(`/${username}/2025`);
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("public, max-age=300, s-maxage=3600");
    expect(body).toMatchObject({
      kind: "recap",
      ogType: "website",
      title: `${username}'s 2025 in review`,
      description: "1 film and 4 hours on Interis. Top director: Ada Lens.",
      path: `/recap/${username}/2025`,
    });
    expect(body?.image).toMatch(new RegExp(`^/api/public/og/recap/${username}/2025\\.jpg\\?v=[0-9a-f]{10}$`));

    const card = await apiRequest(baseUrl(), body!.image!);
    expect(card.status).toBe(200);
    expect(card.headers.get("content-type")).toBe("image/jpeg");
    expect(card.headers.get("cache-control")).toBe("public, max-age=3600, s-maxage=21600");
    const bytes = new Uint8Array(await card.arrayBuffer());
    expect([...bytes.slice(0, 3)]).toEqual([0xff, 0xd8, 0xff]);
  });

  it("reads the current year as so far, and still previews an empty year", async () => {
    const { username } = await signUpTestUser(baseUrl(), "rcnow");
    const { body } = await getMeta(`/${username}/${THIS_YEAR}`);
    expect(body).toMatchObject({
      title: `${username}'s ${THIS_YEAR} so far`,
      description: `${username}'s year in film and TV on Interis.`,
    });
    expect((await apiRequest(baseUrl(), `/api/public/og/recap/${username}/${THIS_YEAR}.jpg`)).status).toBe(200);
  });

  it("404s for unknown or suspended users and out-of-range years, card included", async () => {
    const { username } = await signUpTestUser(baseUrl(), "rcsus");
    const [row] = await db.select({ id: user.id }).from(user).where(eq(user.username, username));
    await db.update(profiles).set({ isSuspended: true }).where(eq(profiles.userId, row!.id));

    expect((await getMeta(`/${username}/2025`)).response.status).toBe(404);
    expect((await apiRequest(baseUrl(), `/api/public/og/recap/${username}/2025.jpg`)).status).toBe(404);
    expect((await getMeta("/no-such-recap-user/2025")).response.status).toBe(404);
    expect((await getMeta(`/${username}/1999`)).response.status).toBe(404);
    expect((await getMeta(`/${username}/${THIS_YEAR + 1}`)).response.status).toBe(404);
    expect((await apiRequest(baseUrl(), `/api/public/og/recap/${username}/1999.jpg`)).status).toBe(404);
  });
});
