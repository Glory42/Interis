import type {
  FilmArchivePeriod,
  FilmArchiveSort,
  FilmDetailReviewSort,
} from "../dto/films.dto";
import type { PersonLinkItem } from "../../people/types/people.types";

export type ArchiveGenre = {
  id: number;
  name: string;
};

export type FilmArchiveItem = {
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
  tmdbVoteCount: number | null;
  ratedLogCount: number;
  viewerHasLogged: boolean;
  viewerWatchlisted: boolean;
};

export type FilmArchiveFeaturedFilm = {
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

export type FilmArchiveResponse = {
  totalCount: number;
  filteredCount: number;
  selectedGenre: string | null;
  selectedLanguage: string | null;
  selectedSort: FilmArchiveSort;
  selectedPeriod: FilmArchivePeriod;
  featuredMovie: FilmArchiveFeaturedFilm | null;
  availableGenres: ArchiveGenreOption[];
  page: number;
  limit: number;
  hasMore: boolean;
  nextPage: number | null;
  items: FilmArchiveItem[];
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
  tmdbVoteCount: number | null;
  ratedLogCount: number;
};

export type FilmDetailRatingBreakdownBucket = {
  ratingValue: number;
  count: number;
  percentage: number;
};

export type FilmDetailReviewItem = {
  id: string;
  content: string;
  containsSpoilers: boolean;
  createdAt: Date;
  updatedAt: Date;
  watchedDate: string | null;
  rating: number | null;
  likeCount: number;
  viewerHasLiked: boolean;
  author: {
    id: string;
    username: string;
    displayUsername: string | null;
    avatarUrl: string | null;
  };
};

export type FilmDetailUserRating = {
  diaryEntryId: string | null;
  reviewId: string | null;
  watchedDate: string | null;
  rewatch: boolean;
  rating: number | null;
  reviewContent: string | null;
  reviewContainsSpoilers: boolean | null;
};

export type FilmDetailResponse = {
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
    directors: PersonLinkItem[];
    cast: PersonLinkItem[];
    runtime: number | null;
    overview: string | null;
    tagline: string | null;
    genres: ArchiveGenre[];
    languageCode: string | null;
    productionCountries: string[];
    budget: number | null;
    revenue: number | null;
    globalRating: number | null;
    globalRatingVoteCount: number | null;
  };
  logsCount: number;
  reviewCount: number;
  userRating: FilmDetailUserRating | null;
  reviewsSort: FilmDetailReviewSort;
  reviews: FilmDetailReviewItem[];
  reviewsPage: number;
  reviewsLimit: number;
  reviewsHasMore: boolean;
  ratingBreakdown: {
    totalRatedReviews: number;
    averageRating: number | null;
    buckets: FilmDetailRatingBreakdownBucket[];
  };
  similar: SimilarFilmItem[];
};

export type FilmReviewsPageResponse = {
  items: FilmDetailReviewItem[];
  sort: FilmDetailReviewSort;
  page: number;
  limit: number;
  totalCount: number;
  hasMore: boolean;
};

export type SimilarFilmItem = {
  tmdbId: number;
  title: string;
  posterPath: string | null;
  releaseYear: number | null;
};
