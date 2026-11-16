import type { YearReview } from "@/features/year-review/api";

const title = (tmdbId: number, name: string, mediaType: "movie" | "tv" = "movie") => ({
  mediaType,
  tmdbId,
  title: name,
  posterPath: null,
  releaseYear: 1999,
});

export const fullYear = (overrides: Partial<YearReview> = {}): YearReview => ({
  year: 2025,
  isPartialYear: false,
  depth: "full",
  user: { username: "glory42", displayName: "Glory", avatarUrl: null },
  totals: {
    films: 142,
    series: 18,
    logs: 171,
    filmLogs: 150,
    seriesLogs: 21,
    rewatchLogs: 8,
    episodes: 210,
    hoursWatched: 351,
    filmHours: 280,
    seriesHours: 71,
  },
  previousYear: { films: 120, series: 18, hoursWatched: 400 },
  months: Array.from({ length: 12 }, (_, index) => ({ month: index + 1, count: index === 2 ? 23 : 12 })),
  busiestMonth: { month: 3, count: 23 },
  logsPerDay: [{ day: "2025-03-10", count: 2 }, { day: "2025-03-11", count: 1 }],
  longestStreak: { days: 6, start: "2025-03-10", end: "2025-03-15" },
  firstWatch: { ...title(1, "Opening Night"), watchedDate: "2025-01-02" },
  lastWatch: { ...title(2, "Closing Credits"), watchedDate: "2025-12-30" },
  topGenres: [{ genre: "Drama", count: 40 }, { genre: "Thriller", count: 22 }],
  topDirectors: [{ director: "Ada Lens", count: 5, slug: "ada-lens" }],
  decades: [{ decade: 1990, count: 30 }, { decade: 2020, count: 80 }],
  topRated: [{ ...title(3, "Perfect Film"), rating: 10 }, { ...title(4, "Great Show", "tv"), rating: 9 }],
  mostRewatched: { ...title(5, "Comfort Film"), logCount: 4 },
  ratings: { average: 7.8, ratedLogs: 120, communityAverage: 7.1 },
  reviews: {
    count: 31,
    mostLiked: {
      id: "11111111-2222-4333-8444-555555555555",
      mediaType: "movie",
      tmdbId: 3,
      mediaTitle: "Perfect Film",
      posterPath: null,
      likeCount: 12,
      containsSpoilers: false,
      excerpt: "Every frame earns its place.",
    },
  },
  listsCreated: 3,
  newFollowers: 9,
  goal: { targetFilms: 100, targetSeries: null, filmsWatched: 142, seriesWatched: 18, reached: true },
  posterPaths: [],
  availableYears: [2025, 2024],
  ...overrides,
});

export const thinYear = (): YearReview =>
  fullYear({
    depth: "thin",
    totals: { ...fullYear().totals, films: 3, series: 0, logs: 3, filmLogs: 3, seriesLogs: 0, hoursWatched: 6 },
    previousYear: null,
    topRated: [{ ...title(3, "Perfect Film"), rating: 10 }],
    goal: null,
  });

export const emptyYear = (): YearReview =>
  fullYear({
    depth: "empty",
    totals: { ...fullYear().totals, films: 0, series: 0, logs: 0, filmLogs: 0, seriesLogs: 0, rewatchLogs: 0, episodes: 0, hoursWatched: 0, filmHours: 0, seriesHours: 0 },
    previousYear: null,
    months: Array.from({ length: 12 }, (_, index) => ({ month: index + 1, count: 0 })),
    busiestMonth: null,
    logsPerDay: [],
    longestStreak: null,
    firstWatch: null,
    lastWatch: null,
    topGenres: [],
    topDirectors: [],
    decades: [],
    topRated: [],
    mostRewatched: null,
    ratings: { average: null, ratedLogs: 0, communityAverage: null },
    reviews: { count: 0, mostLiked: null },
    listsCreated: 0,
    newFollowers: 0,
    goal: null,
    availableYears: [],
  });
