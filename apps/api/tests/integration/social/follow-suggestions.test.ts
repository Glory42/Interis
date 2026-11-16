import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { eq, sql } from "drizzle-orm";
import { apiRequest } from "../../support/app/http-client";
import { signUpTestUser, type SignedUpTestUser } from "../../support/app/auth-flow";
import type { CookieJar } from "../../support/app/cookie-jar";
import { seedTestFilm, seedTestSeries } from "../../support/factories/media.factory";
import { startTestServer, type RunningTestServer } from "../../support/app/test-server";
import { db } from "../../../src/infrastructure/database/db";
import { authSessions, user } from "../../../src/infrastructure/database/auth.entity";
import { profiles } from "../../../src/modules/users/users.entity";

type Suggestion = {
  id: string;
  username: string;
  sharedCount: number;
  agreeTitle: string | null;
  followerCount: number;
};

type Mark = { mediaType: "movie" | "tv"; tmdbId: number; rating?: number };

describe("GET /api/social/suggestions", () => {
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

  const send = async (jar: CookieJar | undefined, method: string, path: string, body?: unknown) =>
    apiRequest(
      getServer().baseUrl,
      path,
      {
        method,
        headers: body === undefined ? {} : { "content-type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
      },
      jar,
    );

  const signUp = (prefix: string) => signUpTestUser(getServer().baseUrl, prefix);

  const mark = async (person: SignedUpTestUser, marks: Mark[]) => {
    const response = await send(person.jar, "POST", "/api/onboarding/taste", {
      items: marks.map((item) => ({ ...item, watched: true })),
    });
    expect(response.status).toBe(200);
  };

  const userIdOf = async (person: SignedUpTestUser) => {
    const [row] = await db.select({ id: user.id }).from(user).where(eq(user.username, person.username));
    return row!.id;
  };

  const suggestionsFor = async (person: SignedUpTestUser, limit = 20) => {
    const response = await send(person.jar, "GET", `/api/social/suggestions?limit=${limit}`);
    expect(response.status).toBe(200);
    return (await response.json()) as Suggestion[];
  };

  it("requires auth and a sane limit", async () => {
    expect((await send(undefined, "GET", "/api/social/suggestions")).status).toBe(401);
    const viewer = await signUp("sglimit");
    expect((await send(viewer.jar, "GET", "/api/social/suggestions?limit=500")).status).toBe(400);
    expect(await suggestionsFor(viewer, 3)).toHaveLength(3);
  });

  it("ranks by taste overlap, weighted by rating agreement", async () => {
    const [thing, alien, heat] = await Promise.all([
      seedTestFilm("The Thing"),
      seedTestFilm("Alien"),
      seedTestFilm("Heat"),
    ]);
    const series = await seedTestSeries("Twin Peaks");
    const [viewer, twin, contrarian, casual] = await Promise.all([
      signUp("sgviewer"),
      signUp("sgtwin"),
      signUp("sgcontra"),
      signUp("sgcasual"),
    ]);

    await mark(viewer, [
      { mediaType: "movie", tmdbId: thing.tmdbId, rating: 9 },
      { mediaType: "movie", tmdbId: alien.tmdbId, rating: 8 },
      { mediaType: "movie", tmdbId: heat.tmdbId },
      { mediaType: "tv", tmdbId: series.tmdbId },
    ]);
    // Same titles, same ratings.
    await mark(twin, [
      { mediaType: "movie", tmdbId: thing.tmdbId, rating: 9 },
      { mediaType: "movie", tmdbId: alien.tmdbId, rating: 8.5 },
      { mediaType: "movie", tmdbId: heat.tmdbId },
    ]);
    // More titles in common than casual, but disagrees on both ratings.
    await mark(contrarian, [
      { mediaType: "movie", tmdbId: thing.tmdbId, rating: 2 },
      { mediaType: "movie", tmdbId: alien.tmdbId, rating: 1 },
      { mediaType: "tv", tmdbId: series.tmdbId },
    ]);
    await mark(casual, [{ mediaType: "movie", tmdbId: heat.tmdbId }]);

    const suggestions = await suggestionsFor(viewer);
    const position = (person: SignedUpTestUser) =>
      suggestions.findIndex((suggestion) => suggestion.username === person.username);

    expect(position(twin)).toBe(0);
    expect(position(contrarian)).toBe(1);
    expect(position(casual)).toBe(2);
    expect(suggestions[0]).toMatchObject({ sharedCount: 3, agreeTitle: "The Thing" });
    expect(suggestions[1]).toMatchObject({ sharedCount: 3, agreeTitle: null });
    expect(suggestions[2]).toMatchObject({ sharedCount: 1, agreeTitle: null });
    // Everyone after the overlap is a fallback with nothing in common.
    expect(suggestions.slice(3).every((suggestion) => suggestion.sharedCount === 0)).toBe(true);
    expect(suggestions.some((suggestion) => suggestion.username === viewer.username)).toBe(false);
  });

  it("leaves out people already followed, suspended, blocked, muted or inactive", async () => {
    const film = await seedTestFilm("Shared Classic");
    const people = await Promise.all(
      ["sgfollowed", "sgsuspended", "sgblocked", "sgblocker", "sgmuted", "sginactive", "sgkept"].map(signUp),
    );
    const [followed, suspended, blocked, blocker, muted, inactive, kept] = people;
    const viewer = await signUp("sgexcl");

    await Promise.all(
      [viewer, ...people].map((person) => mark(person, [{ mediaType: "movie", tmdbId: film.tmdbId }])),
    );

    expect((await send(viewer.jar, "POST", `/api/social/follow/${followed!.username}`)).status).toBe(200);
    expect((await send(viewer.jar, "POST", `/api/moderation/block/${blocked!.username}`)).status).toBe(200);
    expect((await send(blocker!.jar, "POST", `/api/moderation/block/${viewer.username}`)).status).toBe(200);
    expect((await send(viewer.jar, "POST", `/api/moderation/mute/${muted!.username}`)).status).toBe(200);
    await db.update(profiles).set({ isSuspended: true }).where(eq(profiles.userId, await userIdOf(suspended!)));
    // Inactive: no session refreshed and no Activity in the last 90 days.
    await db
      .update(authSessions)
      .set({ updatedAt: sql`now() - interval '200 days'` })
      .where(eq(authSessions.userId, await userIdOf(inactive!)));

    const usernames = (await suggestionsFor(viewer)).map((suggestion) => suggestion.username);
    expect(usernames[0]).toBe(kept!.username);
    for (const excluded of [followed, suspended, blocked, blocker, muted, inactive]) {
      expect(usernames).not.toContain(excluded!.username);
    }
  });

  it("falls back to the most followed users when there is no overlap", async () => {
    const popular = await signUp("sgpopular");
    const fans = await Promise.all([1, 2, 3, 4, 5, 6].map(() => signUp("sgfan")));
    await Promise.all(fans.map((fan) => send(fan.jar, "POST", `/api/social/follow/${popular.username}`)));

    const viewer = await signUp("sgfresh");
    const suggestions = await suggestionsFor(viewer);

    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions.every((suggestion) => suggestion.sharedCount === 0)).toBe(true);
    const followerCounts = suggestions.map((suggestion) => suggestion.followerCount);
    expect(followerCounts).toEqual([...followerCounts].sort((a, b) => b - a));
    expect(suggestions.map((suggestion) => suggestion.username)).toContain(popular.username);
  });
});
