import { describe, expect, it } from "bun:test";
import { TvDetailService } from "../../../src/modules/tv/services/tv-detail.service";
import type { TvDetailTmdbClient } from "../../../src/modules/tv/services/tv-detail-tmdb-client";
import { seedTestSeries } from "../../support/factories/media.factory";

// Mirrors movie-detail-tmdb-seam.test.ts, for SerialsDetailService.
const rejectingTmdbClient: TvDetailTmdbClient = {
  getDetails: () => Promise.reject(new Error("TMDB is down")),
  getAggregateCredits: () => Promise.reject(new Error("TMDB is down")),
  getSimilar: () => Promise.reject(new Error("TMDB is down")),
};

describe("TvDetailService.getDetail — TMDB failure paths", () => {
  it("still returns a full detail response when every TMDB call fails", async () => {
    const serial = await seedTestSeries("TMDB-down serial");

    const detail = await TvDetailService.getDetail(
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
