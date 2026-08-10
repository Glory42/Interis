import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { and, eq } from "drizzle-orm";
import { apiRequest } from "../../support/app/http-client";
import { signUpTestUser } from "../../support/app/auth-flow";
import { seedTestSerial } from "../../support/factories/media.factory";
import {
  startTestServer,
  type RunningTestServer,
} from "../../support/app/test-server";
import { db } from "../../../src/infrastructure/database/db";
import { activities } from "../../../src/modules/social/social.entity";
import type { ActivityType } from "../../../src/modules/social/repositories/social.repository";
import { user } from "../../../src/infrastructure/database/auth.entity";

// SerialsActivityRecorder.record() is fire-and-forget - the HTTP response
// doesn't wait for the activity insert to land - so every test here gives
// the write a brief moment to settle before asserting against the DB.
const waitForActivityWrite = () => new Promise((resolve) => setTimeout(resolve, 150));

const getUserIdByUsername = async (username: string): Promise<string> => {
  const [row] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.username, username));
  if (!row) {
    throw new Error(`Test user ${username} not found`);
  }
  return row.id;
};

const getActivitiesFor = async (userId: string, type: ActivityType) =>
  db
    .select()
    .from(activities)
    .where(and(eq(activities.userId, userId), eq(activities.type, type)));

describe("serial activity recording", () => {
  let testServer: RunningTestServer | null = null;

  const getServer = (): RunningTestServer => {
    if (!testServer) {
      throw new Error("Test server is not running");
    }
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

  it("records a season rating activity tagged with the season target, not the episode", async () => {
    const { jar, username } = await signUpTestUser(getServer().baseUrl, "seasonact");
    const serial = await seedTestSerial();

    const response = await apiRequest(
      getServer().baseUrl,
      `/api/serials/${serial.tmdbId}/seasons/2/interaction`,
      {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ rating: 8 }),
      },
      jar,
    );
    expect(response.status).toBe(200);
    await waitForActivityWrite();

    const userId = await getUserIdByUsername(username);
    const rows = await getActivitiesFor(userId, "liked_movie");
    expect(rows).toHaveLength(1);

    const metadata = JSON.parse(rows[0]!.metadata ?? "{}") as {
      seasonNumber?: number;
      episodeNumber?: number;
      rating?: number;
    };
    expect(metadata.seasonNumber).toBe(2);
    expect(metadata.episodeNumber).toBeUndefined();
    expect(metadata.rating).toBe(8);
  });

  it("records an episode rating activity tagged with both season and episode numbers", async () => {
    const { jar, username } = await signUpTestUser(getServer().baseUrl, "epact");
    const serial = await seedTestSerial();

    const response = await apiRequest(
      getServer().baseUrl,
      `/api/serials/${serial.tmdbId}/seasons/3/episodes/5/interaction`,
      {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ rating: 7 }),
      },
      jar,
    );
    expect(response.status).toBe(200);
    await waitForActivityWrite();

    const userId = await getUserIdByUsername(username);
    const rows = await getActivitiesFor(userId, "liked_movie");
    expect(rows).toHaveLength(1);

    const metadata = JSON.parse(rows[0]!.metadata ?? "{}") as {
      seasonNumber?: number;
      episodeNumber?: number;
      rating?: number;
    };
    expect(metadata.seasonNumber).toBe(3);
    expect(metadata.episodeNumber).toBe(5);
    expect(metadata.rating).toBe(7);
  });

  it("does not record a duplicate rating activity when the rating is resubmitted unchanged", async () => {
    const { jar, username } = await signUpTestUser(getServer().baseUrl, "duprate");
    const serial = await seedTestSerial();

    const firstResponse = await apiRequest(
      getServer().baseUrl,
      `/api/serials/${serial.tmdbId}/seasons/1/interaction`,
      {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ rating: 6 }),
      },
      jar,
    );
    expect(firstResponse.status).toBe(200);
    await waitForActivityWrite();

    const secondResponse = await apiRequest(
      getServer().baseUrl,
      `/api/serials/${serial.tmdbId}/seasons/1/interaction`,
      {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ rating: 6 }),
      },
      jar,
    );
    expect(secondResponse.status).toBe(200);
    await waitForActivityWrite();

    const userId = await getUserIdByUsername(username);
    const rows = await getActivitiesFor(userId, "liked_movie");
    expect(rows).toHaveLength(1);
  });

  it("records a season review activity tagged with the season target", async () => {
    const { jar, username } = await signUpTestUser(getServer().baseUrl, "seasrevact");
    const serial = await seedTestSerial();

    const response = await apiRequest(
      getServer().baseUrl,
      `/api/serials/${serial.tmdbId}/seasons/1/review`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content: "Great season.", containsSpoilers: false }),
      },
      jar,
    );
    expect(response.status).toBe(200);
    await waitForActivityWrite();

    const userId = await getUserIdByUsername(username);
    const rows = await getActivitiesFor(userId, "review");
    expect(rows).toHaveLength(1);

    const metadata = JSON.parse(rows[0]!.metadata ?? "{}") as {
      seasonNumber?: number;
      episodeNumber?: number;
      excerpt?: string;
    };
    expect(metadata.seasonNumber).toBe(1);
    expect(metadata.episodeNumber).toBeUndefined();
    expect(metadata.excerpt).toBe("Great season.");
  });

  it("records an episode review activity tagged with both season and episode numbers", async () => {
    const { jar, username } = await signUpTestUser(getServer().baseUrl, "eprevact");
    const serial = await seedTestSerial();

    const response = await apiRequest(
      getServer().baseUrl,
      `/api/serials/${serial.tmdbId}/seasons/1/episodes/4/review`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content: "Great episode.", containsSpoilers: true }),
      },
      jar,
    );
    expect(response.status).toBe(200);
    await waitForActivityWrite();

    const userId = await getUserIdByUsername(username);
    const rows = await getActivitiesFor(userId, "review");
    expect(rows).toHaveLength(1);

    const metadata = JSON.parse(rows[0]!.metadata ?? "{}") as {
      seasonNumber?: number;
      episodeNumber?: number;
      containsSpoilers?: boolean;
    };
    expect(metadata.seasonNumber).toBe(1);
    expect(metadata.episodeNumber).toBe(4);
    expect(metadata.containsSpoilers).toBe(true);
  });

  it("records a diary-entry activity tagged with no season/episode fields (series-level target)", async () => {
    const { jar, username } = await signUpTestUser(getServer().baseUrl, "diaryact");
    const serial = await seedTestSerial();

    const response = await apiRequest(
      getServer().baseUrl,
      `/api/serials/${serial.tmdbId}/log`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ watchedDate: "2026-01-15", rating: 9 }),
      },
      jar,
    );
    expect(response.status).toBe(201);
    await waitForActivityWrite();

    const userId = await getUserIdByUsername(username);
    const rows = await getActivitiesFor(userId, "diary_entry");
    expect(rows).toHaveLength(1);

    const metadata = JSON.parse(rows[0]!.metadata ?? "{}") as {
      seasonNumber?: number;
      episodeNumber?: number;
      rating?: number;
    };
    expect(metadata.seasonNumber).toBeUndefined();
    expect(metadata.episodeNumber).toBeUndefined();
    expect(metadata.rating).toBe(9);
  });
});
