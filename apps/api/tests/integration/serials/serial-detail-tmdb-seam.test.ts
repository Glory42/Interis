import { describe, expect, it } from "bun:test";
import { SerialsDetailService } from "../../../src/modules/serials/services/serials-detail.service";
import type { SerialsDetailTmdbClient } from "../../../src/modules/serials/services/serials-detail-tmdb-client";
import { seedTestSerial } from "../../support/factories/media.factory";

// Mirrors movie-detail-tmdb-seam.test.ts: exercises the branches inside
// SerialsDetailService's private gather() where every TMDB call is
// individually swallowed, using the seam (getDetail's optional tmdbClient
// param) instead of depending on whatever TMDB happens to do in CI.
const rejectingTmdbClient: SerialsDetailTmdbClient = {
  getDetails: () => Promise.reject(new Error("TMDB is down")),
  getAggregateCredits: () => Promise.reject(new Error("TMDB is down")),
  getSimilar: () => Promise.reject(new Error("TMDB is down")),
};

describe("SerialsDetailService.getDetail — TMDB failure paths", () => {
  it("still returns a full detail response when every TMDB call fails", async () => {
    const serial = await seedTestSerial("TMDB-down serial");

    const detail = await SerialsDetailService.getDetail(
      {
        tmdbId: serial.tmdbId,
        reviewsSort: "popular",
        reviewsPage: 1,
        reviewsLimit: 10,
      },
      rejectingTmdbClient,
    );

    expect(detail).not.toBeNull();
    expect(detail?.series.tmdbId).toBe(serial.tmdbId);
    expect(detail?.similar).toEqual([]);
    expect(detail?.series.cast).toEqual([]);
    expect(detail?.series.creators).toEqual([]);
    expect(detail?.series.crew).toEqual([]);
  });
});
