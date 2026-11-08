import { expect } from "bun:test";
import { and, eq } from "drizzle-orm";
import { apiRequest } from "../app/http-client";
import type { CookieJar } from "../app/cookie-jar";
import { db } from "../../../src/infrastructure/database/db";
import { user } from "../../../src/infrastructure/database/auth.entity";
import { activities } from "../../../src/modules/social/social.entity";
import { seedTestFilm, seedTestSeries } from "./media.factory";

// One Watch Log case per media type, so every behaviour test runs once for
// Films (/api/diary) and once for Series (/api/serials/.../log).
export type WatchLogMediaCase = {
  label: "Film" | "Series";
  mediaType: "movie" | "tv";
  titleKey: "movie" | "series";
  mediaIdKey: "movieId" | "seriesId";
  seed: (title?: string) => Promise<{ id: number; tmdbId: number }>;
  createPath: (tmdbId: number) => string;
  createBody: (tmdbId: number, body: Record<string, unknown>) => Record<string, unknown>;
  logPath: (entryId: string) => string;
  interactionPath: (tmdbId: number) => string;
  detailPath: (tmdbId: number) => string;
};

export const WATCH_LOG_MEDIA: WatchLogMediaCase[] = [
  {
    label: "Film",
    mediaType: "movie",
    titleKey: "movie",
    mediaIdKey: "movieId",
    seed: seedTestFilm,
    createPath: () => "/api/diary",
    createBody: (tmdbId, body) => ({ tmdbId, ...body }),
    logPath: (entryId) => `/api/diary/${entryId}`,
    interactionPath: (tmdbId) => `/api/interactions/${tmdbId}`,
    detailPath: (tmdbId) => `/api/movies/${tmdbId}/detail`,
  },
  {
    label: "Series",
    mediaType: "tv",
    titleKey: "series",
    mediaIdKey: "seriesId",
    seed: seedTestSeries,
    createPath: (tmdbId) => `/api/serials/${tmdbId}/log`,
    createBody: (_tmdbId, body) => body,
    logPath: (entryId) => `/api/serials/logs/${entryId}`,
    interactionPath: (tmdbId) => `/api/serials/${tmdbId}/interaction`,
    detailPath: (tmdbId) => `/api/serials/${tmdbId}/detail`,
  },
];

export type JsonBody = Record<string, unknown>;

// HTTP helpers bound to one media case and one running server.
export const watchLogClient = (baseUrl: () => string, media: WatchLogMediaCase) => {
  const request = (jar: CookieJar | undefined, method: string, path: string, body?: unknown) =>
    apiRequest(
      baseUrl(),
      path,
      {
        method,
        headers: body === undefined ? {} : { "content-type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
      },
      jar,
    );

  const send = async (jar: CookieJar | undefined, method: string, path: string, body?: unknown) => {
    const response = await request(jar, method, path, body);
    expect(response.status).toBeLessThan(300);
    return (await response.json().catch(() => null)) as JsonBody;
  };

  const log = async (jar: CookieJar, tmdbId: number, body: JsonBody) =>
    (await send(jar, "POST", media.createPath(tmdbId), media.createBody(tmdbId, body))) as {
      entry: { id: string; rating: number | null } & JsonBody;
      review: { id: string; content: string; containsSpoilers: boolean } | null;
    } & JsonBody;

  const logId = async (jar: CookieJar, tmdbId: number, watchedDate: string, rating?: number) =>
    (await log(jar, tmdbId, { watchedDate, rating })).entry.id;

  const interaction = async (jar: CookieJar, tmdbId: number) =>
    (await send(jar, "GET", media.interactionPath(tmdbId))) as {
      liked: boolean;
      watchlisted: boolean;
      watched: boolean;
      rating: number | null;
    };

  const setInteraction = (jar: CookieJar, tmdbId: number, body: JsonBody) =>
    send(jar, "PUT", media.interactionPath(tmdbId), body);

  return { request, send, log, logId, interaction, setInteraction };
};

// Media activities are recorded fire-and-forget; give the insert a moment.
export const waitForActivityWrite = () => new Promise((resolve) => setTimeout(resolve, 150));

export const diaryActivitiesOf = async (username: string) => {
  const [author] = await db.select({ id: user.id }).from(user).where(eq(user.username, username));
  if (!author) throw new Error(`Test user ${username} not found`);
  return db
    .select({ entityId: activities.entityId, metadata: activities.metadata })
    .from(activities)
    .where(and(eq(activities.userId, author.id), eq(activities.type, "diary_entry")));
};
