import type {
  CinemaArchivePeriod,
  CinemaArchiveSort,
  MovieDetailReviewSort,
} from "../dto/movies.dto";

export type ArchiveGenre = {
  id: number;
  name: string;
};

export type CinemaArchiveItem = {
  tmdbId: number;
  title: string;
  posterPath: string | null;
  backdropPath: string | null;
  releaseDate: string | null;
  releaseYear: number | null;
  director: string | null;
  languageCode: string | null;
  genres: ArchiveGenre[];
  primaryGenre: string | null;
  logCount: number;
  avgRatingOutOfTen: number | null;
  tmdbRatingOutOfTen: number | null;
  ratedLogCount: number;
};

export type CinemaArchiveFeaturedMovie = {
  tmdbId: number;
  title: string;
  posterPath: string | null;
  backdropPath: string | null;
  releaseDate: string | null;
  releaseYear: number | null;
  director: string | null;
};

export type ArchiveGenreOption = {
  id: number | null;
  name: string;
  count: number | null;
};

export type CinemaArchiveResponse = {
  totalCount: number;
  filteredCount: number;
  selectedGenre: string | null;
  selectedLanguage: string | null;
  selectedSort: CinemaArchiveSort;
  selectedPeriod: CinemaArchivePeriod;
  featuredMovie: CinemaArchiveFeaturedMovie | null;
  availableGenres: ArchiveGenreOption[];
  page: number;
  limit: number;
  hasMore: boolean;
  nextPage: number | null;
  items: CinemaArchiveItem[];
};

export type LocalArchiveAggregate = {
  tmdbId: number;
  releaseDate: string | null;
  releaseYear: number | null;
  director: string | null;
  languageCode: string | null;
  genres: ArchiveGenre[];
  logCount: number;
  avgRatingOutOfTen: number | null;
  tmdbRatingOutOfTen: number | null;
  ratedLogCount: number;
};

export type MovieDetailRatingBreakdownBucket = {
  ratingValueOutOfFive: 1 | 2 | 3 | 4 | 5;
  count: number;
  percentage: number;
};

export type MovieDetailReviewItem = {
  id: string;
  content: string;
  containsSpoilers: boolean;
  createdAt: Date;
  updatedAt: Date;
  watchedDate: string | null;
  ratingOutOfTen: number | null;
  ratingOutOfFive: number | null;
  likeCount: number;
  viewerHasLiked: boolean;
  author: {
    id: string;
    username: string;
    displayUsername: string | null;
    image: string | null;
    avatarUrl: string | null;
  };
};

export type MovieDetailUserRating = {
  diaryEntryId: string | null;
  reviewId: string | null;
  watchedDate: string | null;
  rewatch: boolean;
  ratingOutOfTen: number | null;
  ratingOutOfFive: number | null;
  reviewContent: string | null;
  reviewContainsSpoilers: boolean | null;
};

export type MovieDetailResponse = {
  movie: {
    id: number;
    tmdbId: number;
    title: string;
    originalTitle: string | null;
    posterPath: string | null;
    backdropPath: string | null;
    releaseDate: string | null;
    releaseYear: number | null;
    director: string | null;
    runtime: number | null;
    overview: string | null;
    tagline: string | null;
    genres: ArchiveGenre[];
    languageCode: string | null;
    globalRatingOutOfTen: number | null;
    globalRatingOutOfFive: number | null;
    globalRatingVoteCount: number | null;
  };
  logsCount: number;
  reviewCount: number;
  userRating: MovieDetailUserRating | null;
  reviewsSort: MovieDetailReviewSort;
  reviews: MovieDetailReviewItem[];
  ratingBreakdown: {
    totalRatedReviews: number;
    averageRatingOutOfFive: number | null;
    buckets: MovieDetailRatingBreakdownBucket[];
  };
};
