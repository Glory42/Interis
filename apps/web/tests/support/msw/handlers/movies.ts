import { http, HttpResponse } from "msw";

const movieSearchResult = [
  {
    id: 550,
    title: "Fight Club",
    poster_path: "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
    release_date: "1999-10-15",
    overview: "Mischief. Soap. Rules.",
  },
];

const movieArchiveResponse = {
  totalCount: 1,
  filteredCount: 1,
  selectedGenre: null,
  selectedLanguage: null,
  selectedSort: "trending",
  selectedPeriod: "all_time",
  featuredMovie: {
    tmdbId: 550,
    title: "Fight Club",
    posterPath: "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
    backdropPath: null,
    releaseDate: "1999-10-15",
    releaseYear: 1999,
    director: "David Fincher",
    ratingOutOfTen: 8.4,
  },
  availableGenres: [],
  page: 1,
  limit: 20,
  hasMore: false,
  nextPage: null,
  items: [
    {
      tmdbId: 550,
      title: "Fight Club",
      posterPath: "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
      backdropPath: null,
      releaseDate: "1999-10-15",
      releaseYear: 1999,
      director: "David Fincher",
      languageCode: "en",
      genres: [{ id: 18, name: "Drama" }],
      primaryGenre: "Drama",
      logCount: 0,
      avgRatingOutOfTen: null,
      tmdbRatingOutOfTen: 8.4,
      ratedLogCount: 0,
      viewerHasLogged: false,
      viewerWatchlisted: false,
    },
  ],
};

export const moviesHandlers = [
  http.get("*/api/movies/trending", () => {
    return HttpResponse.json([
      {
        tmdbId: 550,
        title: "Fight Club",
        posterPath: "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
        releaseYear: 1999,
      },
    ]);
  }),
  http.get("*/api/movies/recent", () => {
    return HttpResponse.json(movieSearchResult);
  }),
  http.get("*/api/movies/search", () => {
    return HttpResponse.json(movieSearchResult);
  }),
  http.get("*/api/movies/archive", () => {
    return HttpResponse.json(movieArchiveResponse);
  }),
  http.get("*/api/movies/:tmdbId/logs", () => {
    return HttpResponse.json([]);
  }),
  http.get("*/api/movies/:tmdbId/detail", ({ params }) => {
    const tmdbId = Number(params.tmdbId);

    return HttpResponse.json({
      movie: {
        id: 1,
        tmdbId,
        title: "Fight Club",
        originalTitle: "Fight Club",
        posterPath: "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
        backdropPath: null,
        releaseDate: "1999-10-15",
        releaseYear: 1999,
      director: "David Fincher",
      directors: [],
      cast: [],
      runtime: 139,
      overview: "Mischief. Soap. Rules.",
      tagline: null,
      genres: [{ id: 18, name: "Drama" }],
      languageCode: "en",
      productionCountries: [],
      budget: null,
      revenue: null,
      cachedAt: "2026-01-01T00:00:00.000Z",
      globalRatingOutOfTen: 8.4,
      globalRatingOutOfFive: 4,
        globalRatingVoteCount: 100,
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
  http.get("*/api/movies/:tmdbId", ({ params }) => {
    const tmdbId = Number(params.tmdbId);

    return HttpResponse.json({
      id: 1,
      tmdbId,
      title: "Fight Club",
      originalTitle: "Fight Club",
      posterPath: "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
      backdropPath: null,
      releaseDate: "1999-10-15",
      releaseYear: 1999,
      director: "David Fincher",
      runtime: 139,
      overview: "Mischief. Soap. Rules.",
      tagline: null,
      genres: [{ id: 18, name: "Drama" }],
      cachedAt: "2026-01-01T00:00:00.000Z",
    });
  }),
];
