import { describe, expect, it } from "bun:test";
import {
  assembleSerialDetail,
  type SerialDetailInputs,
} from "../../../src/modules/serials/helpers/assemble-serial-detail.helper";

const d = (iso: string) => new Date(iso);

const engagementFrom = (
  likeCounts: Record<string, number>,
  viewerLiked: string[],
): SerialDetailInputs["engagement"] => {
  const likeCountByReviewId = new Map(Object.entries(likeCounts));
  const viewerLikedReviewIds = new Set(viewerLiked);
  return {
    likeCountByReviewId,
    viewerLikedReviewIds,
    likeCountFor: (id) => likeCountByReviewId.get(id) ?? 0,
    viewerHasLiked: (id) => viewerLikedReviewIds.has(id),
  };
};

const seriesReviewRow = (over: Partial<SerialDetailInputs["reviewRows"][number]>) =>
  ({
    id: "s1",
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
  }) as SerialDetailInputs["reviewRows"][number];

const seasonEpisodeItem = (id: string, createdAt: Date, likeCount: number): SerialDetailInputs["seasonEpisodeReviews"][number] =>
  ({
    id,
    content: "ep review",
    containsSpoilers: false,
    createdAt,
    updatedAt: createdAt,
    watchedDate: null,
    rating: null,
    likeCount,
    viewerHasLiked: false,
    author: { id: "u2", username: "bob", displayUsername: null, avatarUrl: null },
    context: { seasonNumber: 1, episodeNumber: 3, episodeName: "Pilot" },
  }) as SerialDetailInputs["seasonEpisodeReviews"][number];

const baseSeries = {
  id: 7,
  tmdbId: 900,
  title: "The Show",
  originalTitle: "El Show",
  posterPath: "/p.jpg",
  backdropPath: "/b.jpg",
  firstAirDate: "2018-09-01",
  firstAirYear: 2018,
  lastAirDate: "2022-05-01",
  creator: null,
  network: null,
  episodeRuntime: null,
  numberOfSeasons: null,
  numberOfEpisodes: 40,
  status: null,
  languageCode: null,
  overview: "ov",
  tagline: "tag",
  genres: [{ id: 18, name: "Drama" }],
} as SerialDetailInputs["cachedSeries"];

const tmdbDetailFixture = (over: Record<string, unknown> = {}) =>
  ({
    id: 900,
    name: "The Show",
    original_name: "El Show",
    poster_path: "/p.jpg",
    backdrop_path: "/b.jpg",
    first_air_date: "2018-09-01",
    last_air_date: "2022-05-01",
    created_by: [],
    networks: [],
    episode_run_time: [],
    number_of_seasons: 3,
    number_of_episodes: 22,
    status: "Ended",
    overview: "ov",
    tagline: "tag",
    original_language: "en",
    genres: [{ id: 18, name: "Drama" }],
    in_production: false,
    vote_average: 8.2,
    vote_count: 500,
    seasons: [
      { id: 1, season_number: 1, name: "Season 1", episode_count: 10, air_date: "2018-09-01", poster_path: null },
      { id: 2, season_number: 2, name: "Season 2", episode_count: 12, air_date: "2019-09-01", poster_path: null },
      { id: 0, season_number: 0, name: "Specials", episode_count: 3, air_date: null, poster_path: null },
    ],
    ...over,
  }) as NonNullable<SerialDetailInputs["tmdbDetail"]>;

const makeInputs = (over: Partial<SerialDetailInputs> = {}): SerialDetailInputs => ({
  cachedSeries: baseSeries,
  tmdbDetail: null,
  creators: [],
  cast: [],
  crew: [],
  logsCount: 0,
  reviewRows: [],
  engagement: engagementFrom({}, []),
  seasonEpisodeReviews: [],
  communityRatings: [],
  tmdbSimilar: [],
  userSeasonInteractions: [],
  viewerDiary: null,
  viewerReview: null,
  viewerTracking: null,
  viewerUserId: null,
  reviewsSort: "recent",
  reviewsPage: 1,
  reviewsLimit: 10,
  reviewsTotalCount: 0,
  ...over,
});

describe("assembleSerialDetail", () => {
  describe("reviews", () => {
    it("concatenates series + season/episode reviews and sorts them together", () => {
      const inputs = makeInputs({
        reviewRows: [
          seriesReviewRow({ id: "series-old", createdAt: d("2026-01-01") }),
          seriesReviewRow({ id: "series-new", createdAt: d("2026-04-01") }),
        ],
        seasonEpisodeReviews: [
          seasonEpisodeItem("ep-mid", d("2026-02-01"), 9),
          seasonEpisodeItem("ep-recent", d("2026-03-01"), 0),
        ],
        engagement: engagementFrom({ "series-old": 2, "series-new": 0 }, ["series-new"]),
        reviewsSort: "popular",
        reviewsTotalCount: 2,
      });

      const res = assembleSerialDetail(inputs);

      expect(res.reviewCount).toBe(4);
      // popular: like count desc, newest-first tie-break
      expect(res.reviews.map((r) => r.id)).toEqual(["ep-mid", "series-old", "series-new", "ep-recent"]);
      expect(res.reviews.find((r) => r.id === "series-new")).toMatchObject({
        likeCount: 0,
        viewerHasLiked: true,
      });
    });
  });

  describe("series envelope with TMDB detail present", () => {
    it("maps seasons, computes episode count from non-special seasons, and the rating", () => {
      const res = assembleSerialDetail(
        makeInputs({
          tmdbDetail: tmdbDetailFixture(),
          userSeasonInteractions: [
            { seasonNumber: 2, watched: true, liked: false, rating: 7, hasReview: true },
          ] as SerialDetailInputs["userSeasonInteractions"],
          viewerUserId: "viewer-1",
        }),
      );

      expect(res.series.seasons.map((s) => s.seasonNumber)).toEqual([0, 1, 2]);
      expect(res.series.numberOfEpisodes).toBe(22); // 10 + 12, specials excluded
      expect(res.series.globalRating).toBe(8.2);
      expect(res.series.globalRatingVoteCount).toBe(500);
      expect(res.series.inProduction).toBe(false);
      expect(res.series.status).toBe("Ended"); // from normalized tmdb, cachedSeries.status is null

      const season2 = res.series.seasons.find((s) => s.seasonNumber === 2);
      expect(season2?.viewerInteraction).toEqual({
        watched: true,
        liked: false,
        rating: 7,
        hasReview: true,
      });
    });

    it("nulls globalRating when the vote count is zero", () => {
      const res = assembleSerialDetail(
        makeInputs({ tmdbDetail: tmdbDetailFixture({ vote_count: 0 }) }),
      );
      expect(res.series.globalRating).toBeNull();
      expect(res.series.globalRatingVoteCount).toBeNull();
    });
  });

  describe("series envelope with TMDB detail absent", () => {
    it("falls back to the cached series row", () => {
      const res = assembleSerialDetail(makeInputs({ tmdbDetail: null }));

      expect(res.series.seasons).toEqual([]);
      expect(res.series.numberOfEpisodes).toBe(40); // cachedSeries.numberOfEpisodes
      expect(res.series.globalRating).toBeNull();
      expect(res.series.inProduction).toBeNull();
      expect(res.series.status).toBeNull();
    });
  });

  describe("creator name resolution", () => {
    it("prefers the first resolved creator link, then cached, then normalized tmdb", () => {
      expect(
        assembleSerialDetail(
          makeInputs({ creators: [{ name: "Link Creator" }] as SerialDetailInputs["creators"] }),
        ).series.creator,
      ).toBe("Link Creator");

      expect(
        assembleSerialDetail(
          makeInputs({ cachedSeries: { ...baseSeries, creator: "Cached Creator" } }),
        ).series.creator,
      ).toBe("Cached Creator");
    });
  });

  describe("userRating / viewerTracking / similar", () => {
    it("returns null userRating and viewerTracking for an anonymous request", () => {
      const res = assembleSerialDetail(makeInputs({ viewerUserId: null }));
      expect(res.userRating).toBeNull();
      expect(res.viewerTracking).toBeNull();
      expect(res.series.seasons).toEqual([]);
    });

    it("passes viewerTracking straight through and merges the viewer's diary/review", () => {
      const tracking = {
        watchedEpisodesCount: 5,
        watchedEpisodes: [{ seasonNumber: 1, episodeNumber: 2 }],
      } as SerialDetailInputs["viewerTracking"];

      const res = assembleSerialDetail(
        makeInputs({
          viewerUserId: "viewer-1",
          viewerTracking: tracking,
          viewerDiary: {
            id: "diary-1",
            watchedDate: "2026-02-02",
            rewatch: false,
            rating: 9,
          } as SerialDetailInputs["viewerDiary"],
          viewerReview: {
            id: "review-1",
            content: "great",
            containsSpoilers: false,
          } as SerialDetailInputs["viewerReview"],
        }),
      );

      expect(res.viewerTracking).toBe(tracking);
      expect(res.userRating).toEqual({
        diaryEntryId: "diary-1",
        reviewId: "review-1",
        watchedDate: "2026-02-02",
        rewatch: false,
        rating: 9,
        reviewContent: "great",
        reviewContainsSpoilers: false,
      });
    });

    it("caps similar at 12, reads sim.name, and parses first_air_date year", () => {
      const many = Array.from({ length: 15 }, (_, i) => ({
        id: i,
        name: `Sim ${i}`,
        poster_path: null,
        first_air_date: i === 0 ? "2015-01-01" : "",
      })) as SerialDetailInputs["tmdbSimilar"];

      const res = assembleSerialDetail(makeInputs({ tmdbSimilar: many }));

      expect(res.similar).toHaveLength(12);
      expect(res.similar[0]).toEqual({
        tmdbId: 0,
        title: "Sim 0",
        posterPath: null,
        firstAirYear: 2015,
      });
      expect(res.similar[1]!.firstAirYear).toBeNull();
    });
  });
});
