import type { MediaType } from "../../media/constants/media-type.constant";

// "empty": no Diary Entries that year; "thin": a handful, so the page and card stay short.
export type YearReviewDepth = "empty" | "thin" | "full";

export type YearReviewOwner = {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
};

export type YearReviewTitle = {
  mediaType: MediaType;
  tmdbId: number;
  title: string;
  posterPath: string | null;
  backdropPath: string | null;
  releaseYear: number | null;
};

// A title in the story's ranked lists; rating is null when the log was unrated.
export type YearReviewRankedTitle = YearReviewTitle & {
  rating: number | null;
  logCount: number;
  watchedDate: string;
};

export type YearReviewSpotlightReview = {
  id: string;
  // Empty when the Review is marked as containing spoilers.
  excerpt: string;
  containsSpoilers: boolean;
};

export type YearReviewSpotlightTitle = YearReviewRankedTitle & {
  review: YearReviewSpotlightReview | null;
};

export type YearReviewPersonaId =
  | "time-traveller"
  | "completionist"
  | "rewatcher"
  | "marathoner"
  | "curator"
  | "critic"
  | "romantic"
  | "explorer"
  | "devotee";

export type YearReviewPersona = {
  id: YearReviewPersonaId;
  name: string;
  tagline: string;
  description: string;
  traits: string[];
  // Kept for tests and tuning; the UI does not show it.
  score: number;
};

export type YearTotals = {
  films: number;
  series: number;
  filmLogs: number;
  seriesLogs: number;
  rewatchLogs: number;
  filmMinutes: number;
  episodes: number;
  episodeMinutes: number;
};

export type YearReview = {
  year: number;
  // True for the current (UTC) year, which the page reads as "so far".
  isPartialYear: boolean;
  depth: YearReviewDepth;
  user: Omit<YearReviewOwner, "userId">;
  totals: YearTotals & { logs: number; hoursWatched: number; filmHours: number; seriesHours: number };
  // Null when the previous year has no Diary Entries to compare with.
  previousYear: { films: number; series: number; hoursWatched: number } | null;
  months: { month: number; count: number }[];
  busiestMonth: { month: number; count: number } | null;
  busiestDay: { day: string; count: number } | null;
  logsPerDay: { day: string; count: number }[];
  longestStreak: { days: number; start: string; end: string } | null;
  firstWatch: (YearReviewTitle & { watchedDate: string }) | null;
  lastWatch: (YearReviewTitle & { watchedDate: string }) | null;
  topGenres: { genre: string; count: number }[];
  distinctGenres: number;
  topDirectors: { director: string; count: number; slug: string | null }[];
  directorTitles: YearReviewTitle[];
  distinctDirectors: number;
  decades: { decade: number; count: number }[];
  // Median release year across the year's distinct titles; null when unknown.
  viewingAge: number | null;
  // Share of the year's titles released before 1980, 0–1.
  pre1980Share: number | null;
  topRated: (YearReviewTitle & { rating: number })[];
  topFilms: YearReviewRankedTitle[];
  topSeries: YearReviewRankedTitle[];
  topFilm: YearReviewSpotlightTitle | null;
  topSeriesSpotlight: YearReviewSpotlightTitle | null;
  mostRewatched: (YearReviewTitle & { logCount: number }) | null;
  ratings: { average: number | null; ratedLogs: number; communityAverage: number | null };
  // Distinct titles whose best rating that year was 9.0 or higher.
  highRatings: number;
  reviews: {
    count: number;
    mostLiked: {
      id: string;
      mediaType: MediaType;
      tmdbId: number | null;
      mediaTitle: string;
      posterPath: string | null;
      likeCount: number;
      containsSpoilers: boolean;
      // Empty when the Review is marked as containing spoilers.
      excerpt: string;
    } | null;
  };
  listsCreated: number;
  newFollowers: number;
  goal: {
    targetFilms: number | null;
    targetSeries: number | null;
    filmsWatched: number;
    seriesWatched: number;
    reached: boolean;
  } | null;
  // Up to four posters for the share card: top rated first, then the rest of the year.
  // Null for an empty year and for a thin year without a strong enough signal.
  persona: YearReviewPersona | null;
  // Up to 18 posters for the story's cover and persona wall.
  posterPaths: string[];
  // Years with at least one Diary Entry, newest first, for the year selector.
  availableYears: number[];
};
