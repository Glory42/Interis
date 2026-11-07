import type {
  SeriesArchivePeriod,
  SeriesArchiveSort,
  SeriesDetailReviewSort,
} from "../dto/tv.dto";
import type { PersonLinkItem } from "../../people/types/people.types";

export type SeriesGenre = {
  id: number;
  name: string;
};

export type SeriesArchiveItem = {
  tmdbId: number;
  title: string;
  posterPath: string | null;
  backdropPath: string | null;
  firstAirDate: string | null;
  firstAirYear: number | null;
  creator: string | null;
  network: string | null;
  languageCode: string | null;
  genres: SeriesGenre[];
  primaryGenre: string | null;
  logCount: number;
  avgRatingOutOfTen: number | null;
  tmdbRatingOutOfTen: number | null;
  tmdbVoteCount: number | null;
  ratedLogCount: number;
  numberOfEpisodes: number | null;
  viewerHasLogged: boolean;
  viewerWatchlisted: boolean;
  viewerFullyWatched: boolean;
  viewerHasProgress: boolean;
};

export type SeriesArchiveFeaturedItem = {
  tmdbId: number;
  title: string;
  posterPath: string | null;
  backdropPath: string | null;
  firstAirDate: string | null;
  firstAirYear: number | null;
  creator: string | null;
  network: string | null;
};

export type SeriesArchiveGenreOption = {
  id: number | null;
  name: string;
  count: number | null;
};

export type SeriesArchiveResponse = {
  totalCount: number;
  filteredCount: number;
  selectedGenre: string | null;
  selectedLanguage: string | null;
  selectedSort: SeriesArchiveSort;
  selectedPeriod: SeriesArchivePeriod;
  featuredSeries: SeriesArchiveFeaturedItem | null;
  availableGenres: SeriesArchiveGenreOption[];
  page: number;
  limit: number;
  hasMore: boolean;
  nextPage: number | null;
  items: SeriesArchiveItem[];
};

export type SeriesDetailSeason = {
  id: number;
  seasonNumber: number;
  name: string;
  episodeCount: number | null;
  airDate: string | null;
  posterPath: string | null;
  viewerInteraction: {
    watched: boolean;
    liked: boolean;
    rating: number | null;
    hasReview: boolean;
    watchedEpisodeCount: number;
  } | null;
};

export type SeriesDetailEpisode = {
  id: number;
  seasonNumber: number;
  episodeNumber: number;
  name: string;
  overview: string | null;
  airDate: string | null;
  stillPath: string | null;
  runtimeMinutes: number | null;
  runtimeLabel: string | null;
  viewerInteraction: {
    watched: boolean;
    liked: boolean;
    rating: number | null;
    hasReview: boolean;
  } | null;
};

export type SeriesSeasonDetailResponse = {
  tmdbId: number;
  season: {
    id: number;
    seasonNumber: number;
    name: string;
    overview: string | null;
    airDate: string | null;
    posterPath: string | null;
    episodeCount: number;
  };
  episodes: SeriesDetailEpisode[];
};

export type SeriesDetailRatingBreakdownBucket = {
  ratingValue: number;
  count: number;
  percentage: number;
};

export type SeriesDetailReviewItem = {
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
  // Present for season/episode-scoped reviews, null for a whole-series review.
  context: {
    seasonNumber: number;
    episodeNumber: number | null;
    episodeName: string | null;
  } | null;
};

export type SeriesDetailUserRating = {
  diaryEntryId: string | null;
  reviewId: string | null;
  watchedDate: string | null;
  rewatch: boolean;
  rating: number | null;
  reviewContent: string | null;
  reviewContainsSpoilers: boolean | null;
};

export type SeriesDetailResponse = {
  series: {
    id: number;
    tmdbId: number;
    title: string;
    originalTitle: string | null;
    posterPath: string | null;
    backdropPath: string | null;
    firstAirDate: string | null;
    firstAirYear: number | null;
    lastAirDate: string | null;
    creator: string | null;
    creators: PersonLinkItem[];
    cast: PersonLinkItem[];
    crew: PersonLinkItem[];
    network: string | null;
    episodeRuntime: number | null;
    numberOfSeasons: number | null;
    numberOfEpisodes: number | null;
    status: string | null;
    overview: string | null;
    tagline: string | null;
    languageCode: string | null;
    genres: SeriesGenre[];
    globalRating: number | null;
    globalRatingVoteCount: number | null;
    inProduction: boolean | null;
    seasons: SeriesDetailSeason[];
  };
  logsCount: number;
  reviewCount: number;
  userRating: SeriesDetailUserRating | null;
  reviewsSort: SeriesDetailReviewSort;
  reviews: SeriesDetailReviewItem[];
  reviewsPage: number;
  reviewsLimit: number;
  reviewsHasMore: boolean;
  ratingBreakdown: {
    totalRatedReviews: number;
    averageRating: number | null;
    buckets: SeriesDetailRatingBreakdownBucket[];
  };
  similar: SimilarSeriesItem[];
  viewerTracking: SeriesDetailViewerTracking | null;
};

export type SeriesReviewsPageResponse = {
  items: SeriesDetailReviewItem[];
  sort: SeriesDetailReviewSort;
  page: number;
  limit: number;
  totalCount: number;
  hasMore: boolean;
};

export type SeriesDetailViewerTracking = {
  // Regular seasons only; specials are counted separately below.
  watchedEpisodesCount: number;
  watchedEpisodes: { seasonNumber: number; episodeNumber: number }[];
  watchedSpecialEpisodesCount: number;
  currentEpisode: { seasonNumber: number; episodeNumber: number; name: string } | null;
  ratingsCount: number;
  likesCount: number;
  reviewsCount: number;
};

export type SimilarSeriesItem = {
  tmdbId: number;
  title: string;
  posterPath: string | null;
  firstAirYear: number | null;
};
