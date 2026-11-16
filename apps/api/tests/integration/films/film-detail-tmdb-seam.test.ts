import { describe, expect, it, spyOn } from "bun:test";
import { eq } from "drizzle-orm";
import { db } from "../../../src/infrastructure/database/db";
import { films } from "../../../src/modules/films/films.entity";
import { FilmsCacheService } from "../../../src/modules/films/services/films-cache.service";
import { FilmsRepository } from "../../../src/modules/films/repositories/films.repository";
import { FilmsReviewsRepository } from "../../../src/modules/films/repositories/films-reviews.repository";
import { YourRatingService } from "../../../src/modules/media-interactions/services/your-rating.service";
import { UNSAVED_MEDIA_ID } from "../../../src/modules/media/constants/unsaved-media.constants";
import { FilmsDetailService } from "../../../src/modules/films/services/films-detail.service";
import type { FilmsDetailTmdbClient } from "../../../src/modules/films/services/films-detail-tmdb-client";
import { seedTestFilm } from "../../support/factories/media.factory";

// Drives gather()'s swallowed-TMDB-call branches directly via the seam,
// instead of depending on whatever the real TMDB API does in CI.
const rejectingTmdbClient: FilmsDetailTmdbClient = {
  getDetails: () => Promise.reject(new Error("TMDB is down")),
  getCredits: () => Promise.reject(new Error("TMDB is down")),
  getSimilar: () => Promise.reject(new Error("TMDB is down")),
};

describe("FilmsDetailService.getDetail — TMDB failure paths", () => {
  it("still returns a full detail response when every TMDB call fails", async () => {
    const movie = await seedTestFilm("TMDB-down movie");

    const detail = await FilmsDetailService.getDetail(
      {
        tmdbId: movie.tmdbId,
        reviewsSort: "popular",
        reviewsPage: 1,
        reviewsLimit: 10,
      },
      rejectingTmdbClient,
    );

    expect(detail).not.toBeNull();
    expect(detail?.movie.tmdbId).toBe(movie.tmdbId);
    expect(detail?.similar).toEqual([]);
    expect(detail?.movie.cast).toEqual([]);
    expect(detail?.movie.directors).toEqual([]);
  });

  it("backfills the director from credits, but does not fail the response if the write itself fails", async () => {
    const movie = await seedTestFilm("Director-backfill movie");

    const clientWithDirector: FilmsDetailTmdbClient = {
      getDetails: () => Promise.reject(new Error("still down")),
      getSimilar: () => Promise.reject(new Error("still down")),
      getCredits: () =>
        Promise.resolve({
          cast: [],
          crew: [
            {
              id: 42,
              name: "Fake Director",
              job: "Director",
              department: "Directing",
              profile_path: null,
              known_for_department: "Directing",
              popularity: 1,
            },
          ],
        }),
    };

    const detail = await FilmsDetailService.getDetail(
      {
        tmdbId: movie.tmdbId,
        reviewsSort: "popular",
        reviewsPage: 1,
        reviewsLimit: 10,
      },
      clientWithDirector,
    );

    expect(detail).not.toBeNull();
    expect(detail?.movie.director).toBe("Fake Director");
  });
});

describe("FilmsDetailService.getDetail — a title nobody has saved yet", () => {
  it("skips every lookup keyed by the unsaved row's id", async () => {
    const movie = await seedTestFilm("Unsaved-detail movie");
    const [row] = await db.select().from(films).where(eq(films.id, movie.id));
    const findForRead = spyOn(FilmsCacheService, "findForRead").mockResolvedValue({ ...row!, id: UNSAVED_MEDIA_ID });
    const logsCount = spyOn(FilmsRepository, "getLogsCountByMovieId");
    const reviewRows = spyOn(FilmsReviewsRepository, "getReviewRowsByMovieId");
    const community = spyOn(YourRatingService, "communityRatings");
    const viewerReview = spyOn(FilmsRepository, "getViewerReviewRows");

    try {
      const detail = await FilmsDetailService.getDetail(
        { tmdbId: movie.tmdbId, viewerUserId: "viewer-1", reviewsSort: "popular", reviewsPage: 1, reviewsLimit: 10 },
        rejectingTmdbClient,
      );

      expect(detail?.reviews).toEqual([]);
      expect(detail?.reviewCount).toBe(0);
      expect(logsCount).not.toHaveBeenCalled();
      expect(reviewRows).not.toHaveBeenCalled();
      expect(community).not.toHaveBeenCalled();
      expect(viewerReview).not.toHaveBeenCalled();
    } finally {
      for (const spy of [findForRead, logsCount, reviewRows, community, viewerReview]) spy.mockRestore();
    }
  });
});
