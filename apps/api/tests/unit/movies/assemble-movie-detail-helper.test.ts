import { describe, expect, it } from "bun:test";
import {
  assembleMovieDetail,
  type MovieDetailInputs,
} from "../../../src/modules/movies/helpers/assemble-movie-detail.helper";

const d = (iso: string) => new Date(iso);

const engagementFrom = (
  likeCounts: Record<string, number>,
  viewerLiked: string[],
): MovieDetailInputs["engagement"] => {
  const likeCountByReviewId = new Map(Object.entries(likeCounts));
  const viewerLikedReviewIds = new Set(viewerLiked);
  return {
    likeCountByReviewId,
    viewerLikedReviewIds,
    likeCountFor: (id) => likeCountByReviewId.get(id) ?? 0,
    viewerHasLiked: (id) => viewerLikedReviewIds.has(id),
  };
};

const reviewRow = (over: Partial<MovieDetailInputs["reviewRows"][number]>) =>
  ({
    id: "r1",
    content: "text",
    containsSpoilers: false,
    createdAt: d("2026-01-01"),
    updatedAt: d("2026-01-01"),
    watchedDate: null,
    rating: null,
    userId: "u1",
    authorUsername: "alice",
    authorDisplayUsername: null,
    authorAvatarUrl: null,
    ...over,
  }) as MovieDetailInputs["reviewRows"][number];

const baseMovie = {
  id: 1,
  tmdbId: 100,
  title: "The Movie",
  originalTitle: "El Movie",
  posterPath: "/p.jpg",
  backdropPath: "/b.jpg",
  releaseDate: "2020-05-01",
  releaseYear: 2020,
  director: null,
  runtime: 120,
  overview: "overview",
  tagline: "tagline",
  genres: [{ id: 18, name: "Drama" }],
} as MovieDetailInputs["movie"];

const makeInputs = (over: Partial<MovieDetailInputs> = {}): MovieDetailInputs => ({
  movie: baseMovie,
  tmdbDetail: null,
  directors: [],
  cast: [],
  resolvedDirectorName: null,
  logsCount: 0,
  reviewRows: [],
  engagement: engagementFrom({}, []),
  communityRatings: [],
  tmdbSimilar: [],
  viewerDiary: null,
  viewerReview: null,
  viewerUserId: null,
  reviewsSort: "recent",
  reviewsPage: 1,
  reviewsLimit: 10,
  reviewsTotalCount: 0,
  ...over,
});

describe("assembleMovieDetail", () => {
  describe("TMDB detail present (the branch the integration test can't reach)", () => {
    const tmdbDetail = {
      original_language: "es",
      production_countries: [
        { name: " Spain " },
        { name: "" },
        { name: "France" },
      ],
      budget: 5_000_000,
      revenue: 12_000_000,
      vote_average: 7.34,
      vote_count: 900,
    } as NonNullable<MovieDetailInputs["tmdbDetail"]>;

    it("maps language, production countries, budget, revenue and global rating", () => {
      const res = assembleMovieDetail(
        makeInputs({ tmdbDetail, resolvedDirectorName: "Jane Doe" }),
      );

      expect(res.movie.languageCode).toBe("es");
      expect(res.movie.productionCountries).toEqual(["Spain", "France"]);
      expect(res.movie.budget).toBe(5_000_000);
      expect(res.movie.revenue).toBe(12_000_000);
      expect(res.movie.globalRating).toBe(7.3); // normalizeVoteAverage rounds to 1dp
      expect(res.movie.globalRatingVoteCount).toBe(900);
      expect(res.movie.director).toBe("Jane Doe");
    });

    it("nulls budget/revenue/rating that are zero or non-finite", () => {
      const res = assembleMovieDetail(
        makeInputs({
          tmdbDetail: {
            ...tmdbDetail,
            budget: 0,
            revenue: Number.POSITIVE_INFINITY,
            vote_average: 0,
            vote_count: 0,
          } as NonNullable<MovieDetailInputs["tmdbDetail"]>,
        }),
      );

      expect(res.movie.budget).toBeNull();
      expect(res.movie.revenue).toBeNull();
      expect(res.movie.globalRating).toBeNull();
      expect(res.movie.globalRatingVoteCount).toBeNull();
    });
  });

  describe("TMDB detail absent", () => {
    it("leaves the TMDB-only fields null / empty", () => {
      const res = assembleMovieDetail(makeInputs({ tmdbDetail: null }));

      expect(res.movie.languageCode).toBeNull();
      expect(res.movie.productionCountries).toEqual([]);
      expect(res.movie.budget).toBeNull();
      expect(res.movie.revenue).toBeNull();
      expect(res.movie.globalRating).toBeNull();
      expect(res.movie.globalRatingVoteCount).toBeNull();
    });
  });

  describe("reviews", () => {
    const rows = [
      reviewRow({ id: "old-popular", createdAt: d("2026-01-01") }),
      reviewRow({ id: "new-quiet", createdAt: d("2026-03-01") }),
      reviewRow({ id: "mid", createdAt: d("2026-02-01") }),
    ];
    const engagement = engagementFrom(
      { "old-popular": 5, mid: 5, "new-quiet": 0 },
      ["mid"],
    );

    it("sorts by engagement and stamps each item's like count / viewer-liked", () => {
      const res = assembleMovieDetail(
        makeInputs({ reviewRows: rows, engagement, reviewsSort: "popular", reviewsTotalCount: rows.length }),
      );

      expect(res.reviews.map((r) => r.id)).toEqual(["mid", "old-popular", "new-quiet"]);
      expect(res.reviews.find((r) => r.id === "mid")).toMatchObject({
        likeCount: 5,
        viewerHasLiked: true,
      });
      expect(res.reviews.find((r) => r.id === "new-quiet")).toMatchObject({
        likeCount: 0,
        viewerHasLiked: false,
      });
      expect(res.reviewCount).toBe(3);
      expect(res.reviewsSort).toBe("popular");
    });

    it("orders newest-first for the recent sort", () => {
      const res = assembleMovieDetail(
        makeInputs({ reviewRows: rows, engagement, reviewsSort: "recent" }),
      );
      expect(res.reviews.map((r) => r.id)).toEqual(["new-quiet", "mid", "old-popular"]);
    });
  });

  describe("userRating", () => {
    it("is null when there is no viewer", () => {
      expect(assembleMovieDetail(makeInputs({ viewerUserId: null })).userRating).toBeNull();
    });

    it("merges the viewer's diary and review rows when authenticated", () => {
      const res = assembleMovieDetail(
        makeInputs({
          viewerUserId: "viewer-1",
          viewerDiary: {
            id: "diary-1",
            watchedDate: "2026-02-02",
            rewatch: true,
            rating: 8,
          } as MovieDetailInputs["viewerDiary"],
          viewerReview: {
            id: "review-1",
            content: "loved it",
            containsSpoilers: true,
          } as MovieDetailInputs["viewerReview"],
        }),
      );

      expect(res.userRating).toEqual({
        diaryEntryId: "diary-1",
        reviewId: "review-1",
        watchedDate: "2026-02-02",
        rewatch: true,
        rating: 8,
        reviewContent: "loved it",
        reviewContainsSpoilers: true,
      });
    });
  });

  describe("similar list", () => {
    it("caps at 12 and parses the release year from the date", () => {
      const many = Array.from({ length: 15 }, (_, i) => ({
        id: i,
        title: `Sim ${i}`,
        poster_path: null,
        release_date: i === 0 ? "2019-07-07" : "",
      })) as MovieDetailInputs["tmdbSimilar"];

      const res = assembleMovieDetail(makeInputs({ tmdbSimilar: many }));

      expect(res.similar).toHaveLength(12);
      expect(res.similar[0]).toEqual({
        tmdbId: 0,
        title: "Sim 0",
        posterPath: null,
        releaseYear: 2019,
      });
      expect(res.similar[1]!.releaseYear).toBeNull();
    });
  });

  it("passes the community rating breakdown through", () => {
    const res = assembleMovieDetail(
      makeInputs({ communityRatings: [{ rating: 8 }, { rating: 8 }, { rating: 6 }] }),
    );
    expect(res.ratingBreakdown.totalRatedReviews).toBe(3);
    expect(res.ratingBreakdown.averageRating).toBeCloseTo(7.33, 1);
    expect(res.ratingBreakdown.buckets).toHaveLength(10);
  });
});
