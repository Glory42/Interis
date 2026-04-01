export type SearchMoviesQuery = { query: string };
export type MovieParams = { tmdbId: string };

export const cinemaArchiveSortValues = [
  "trending",
  "release_desc",
  "release_asc",
  "logs_desc",
  "rating_user_desc",
  "rating_tmdb_desc",
  "title_asc",
] as const;

export type CinemaArchiveSort = (typeof cinemaArchiveSortValues)[number];

export const cinemaArchivePeriodValues = [
  "all_time",
  "this_year",
  "last_10_years",
  "this_week",
  "today",
] as const;

export type CinemaArchivePeriod = (typeof cinemaArchivePeriodValues)[number];

export type CinemaArchiveQuery = {
  genre?: string;
  language?: string;
  sort?: string;
  period?: string;
  page?: string;
  limit?: string;
};

export const movieDetailReviewSortValues = ["popular", "recent"] as const;

export type MovieDetailReviewSort = (typeof movieDetailReviewSortValues)[number];

export type MovieDetailQuery = {
  reviewsSort?: string;
};
