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
  releaseYear: number | null;
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
  logsPerDay: { day: string; count: number }[];
  longestStreak: { days: number; start: string; end: string } | null;
  firstWatch: (YearReviewTitle & { watchedDate: string }) | null;
  lastWatch: (YearReviewTitle & { watchedDate: string }) | null;
  topGenres: { genre: string; count: number }[];
  topDirectors: { director: string; count: number; slug: string | null }[];
  decades: { decade: number; count: number }[];
  topRated: (YearReviewTitle & { rating: number })[];
  mostRewatched: (YearReviewTitle & { logCount: number }) | null;
  ratings: { average: number | null; ratedLogs: number; communityAverage: number | null };
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
    targetFilms: number;
    targetSeries: number | null;
    filmsWatched: number;
    seriesWatched: number;
    reached: boolean;
  } | null;
  // Up to four posters for the share card: top rated first, then the rest of the year.
  posterPaths: string[];
  // Years with at least one Diary Entry, newest first, for the year selector.
  availableYears: number[];
};
