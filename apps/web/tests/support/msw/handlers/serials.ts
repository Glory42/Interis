import { http, HttpResponse } from "msw";

const serialSearchResult = [
  {
    id: 1399,
    name: "Game of Thrones",
    poster_path: "/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg",
    first_air_date: "2011-04-17",
    overview: "Families, kingdoms, wars.",
  },
];

export const serialsHandlers = [
  http.get("*/api/serials/trending", () => {
    return HttpResponse.json([
      {
        tmdbId: 1399,
        title: "Game of Thrones",
        posterPath: "/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg",
        firstAirYear: 2011,
      },
    ]);
  }),
  http.get("*/api/serials/search", () => {
    return HttpResponse.json(serialSearchResult);
  }),
  http.get("*/api/serials/archive", () => {
    return HttpResponse.json({
      totalCount: 1,
      filteredCount: 1,
      selectedGenre: null,
      selectedLanguage: null,
      selectedSort: "trending",
      selectedPeriod: "all_time",
      featuredSeries: {
        tmdbId: 1399,
        title: "Game of Thrones",
        posterPath: "/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg",
        backdropPath: null,
        firstAirDate: "2011-04-17",
        firstAirYear: 2011,
        creator: "David Benioff",
        network: "HBO",
      },
      availableGenres: [],
      page: 1,
      limit: 20,
      hasMore: false,
      nextPage: null,
      items: [
        {
          tmdbId: 1399,
          title: "Game of Thrones",
          posterPath: "/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg",
          backdropPath: null,
          firstAirDate: "2011-04-17",
          firstAirYear: 2011,
          creator: "David Benioff",
          network: "HBO",
          languageCode: "en",
          genres: [{ id: 10765, name: "Sci-Fi & Fantasy" }],
          primaryGenre: "Sci-Fi & Fantasy",
          logCount: 0,
          avgRatingOutOfTen: null,
          tmdbRatingOutOfTen: 8.9,
          ratedLogCount: 0,
          viewerHasLogged: false,
          viewerWatchlisted: false,
        },
      ],
    });
  }),
  http.get("*/api/serials/:tmdbId/detail", ({ params }) => {
    const tmdbId = Number(params.tmdbId);

    return HttpResponse.json({
      series: {
        id: 1,
        tmdbId,
        title: "Game of Thrones",
        originalTitle: "Game of Thrones",
        posterPath: "/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg",
        backdropPath: null,
        firstAirDate: "2011-04-17",
        firstAirYear: 2011,
        lastAirDate: "2019-05-19",
        creator: "David Benioff",
        creators: [],
        cast: [],
        crew: [],
        network: "HBO",
        episodeRuntime: 60,
        numberOfSeasons: 8,
        numberOfEpisodes: 73,
        status: "Ended",
        overview: "Families, kingdoms, wars.",
        tagline: null,
        languageCode: "en",
        genres: [{ id: 10765, name: "Sci-Fi & Fantasy" }],
        globalRatingOutOfTen: 8.9,
        globalRatingOutOfFive: 4.5,
        globalRatingVoteCount: 100,
        inProduction: false,
        seasons: [],
      },
      logsCount: 0,
      reviewCount: 0,
      userRating: null,
      reviewsSort: "popular",
      reviews: [],
      ratingBreakdown: {
        totalRatedReviews: 0,
        averageRatingOutOfFive: null,
        buckets: [],
      },
    });
  }),
  http.get("*/api/serials/:tmdbId/seasons/:seasonNumber", ({ params }) => {
    return HttpResponse.json({
      tmdbId: Number(params.tmdbId),
      season: {
        id: 1,
        seasonNumber: Number(params.seasonNumber),
        name: "Season 1",
        overview: null,
        airDate: "2011-04-17",
        posterPath: null,
        episodeCount: 10,
      },
      episodes: [],
    });
  }),
  http.get("*/api/serials/:tmdbId/interaction", () => {
    return HttpResponse.json({
      liked: false,
      watchlisted: false,
      ratingOutOfFive: null,
    });
  }),
  http.put("*/api/serials/:tmdbId/interaction", async ({ request }) => {
    const payload = (await request.json()) as Record<string, unknown>;

    return HttpResponse.json({
      liked: payload.liked === true,
      watchlisted: payload.watchlisted === true,
      ratingOutOfFive:
        typeof payload.ratingOutOfFive === "number"
          ? payload.ratingOutOfFive
          : null,
    });
  }),
  http.post("*/api/serials/:tmdbId/log", ({ params }) => {
    return HttpResponse.json({
      entry: {
        id: "entry_1",
        userId: "user_1",
        seriesId: 1,
        watchedDate: "2026-01-01",
        rating: null,
        rewatch: false,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
      series: {
        id: 1,
        tmdbId: Number(params.tmdbId),
        title: "Game of Thrones",
        posterPath: "/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg",
        firstAirYear: 2011,
      },
      review: null,
    });
  }),
  http.get("*/api/serials/:tmdbId", ({ params }) => {
    return HttpResponse.json({
      id: 1,
      tmdbId: Number(params.tmdbId),
      title: "Game of Thrones",
      originalTitle: "Game of Thrones",
      posterPath: "/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg",
      backdropPath: null,
      firstAirDate: "2011-04-17",
      firstAirYear: 2011,
      lastAirDate: "2019-05-19",
      creator: "David Benioff",
      network: "HBO",
      episodeRuntime: 60,
      numberOfSeasons: 8,
      numberOfEpisodes: 73,
      status: "Ended",
      overview: "Families, kingdoms, wars.",
      tagline: null,
      languageCode: "en",
      genres: [{ id: 10765, name: "Sci-Fi & Fantasy" }],
      cachedAt: "2026-01-01T00:00:00.000Z",
    });
  }),
];
