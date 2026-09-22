import { describe, expect, it } from "bun:test";
import { MoviesDetailService } from "../../../src/modules/movies/services/movies-detail.service";
import type { MoviesDetailTmdbClient } from "../../../src/modules/movies/services/movies-detail-tmdb-client";
import { seedTestMovie } from "../../support/factories/media.factory";

// Drives gather()'s swallowed-TMDB-call branches directly via the seam,
// instead of depending on whatever the real TMDB API does in CI.
const rejectingTmdbClient: MoviesDetailTmdbClient = {
  getDetails: () => Promise.reject(new Error("TMDB is down")),
  getCredits: () => Promise.reject(new Error("TMDB is down")),
  getSimilar: () => Promise.reject(new Error("TMDB is down")),
};

describe("MoviesDetailService.getDetail — TMDB failure paths", () => {
  it("still returns a full detail response when every TMDB call fails", async () => {
    const movie = await seedTestMovie("TMDB-down movie");

    const detail = await MoviesDetailService.getDetail(
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
    const movie = await seedTestMovie("Director-backfill movie");

    const clientWithDirector: MoviesDetailTmdbClient = {
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

    const detail = await MoviesDetailService.getDetail(
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
