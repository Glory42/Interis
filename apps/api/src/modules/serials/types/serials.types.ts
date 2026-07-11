import type {
  SerialArchivePeriod,
  SerialArchiveSort,
  SerialDetailReviewSort,
} from "../dto/serials.dto";
import type { PersonLinkItem } from "../../people/types/people.types";

export type SerialGenre = {
  id: number;
  name: string;
};

export type SerialArchiveItem = {
  tmdbId: number;
  title: string;
  posterPath: string | null;
  backdropPath: string | null;
  firstAirDate: string | null;
  firstAirYear: number | null;
  creator: string | null;
  network: string | null;
  languageCode: string | null;
  genres: SerialGenre[];
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

export type SerialArchiveFeaturedItem = {
  tmdbId: number;
  title: string;
  posterPath: string | null;
  backdropPath: string | null;
  firstAirDate: string | null;
  firstAirYear: number | null;
  creator: string | null;
  network: string | null;
};

export type SerialArchiveGenreOption = {
  id: number | null;
  name: string;
  count: number | null;
};

export type SerialArchiveResponse = {
  totalCount: number;
  filteredCount: number;
  selectedGenre: string | null;
  selectedLanguage: string | null;
  selectedSort: SerialArchiveSort;
  selectedPeriod: SerialArchivePeriod;
  featuredSeries: SerialArchiveFeaturedItem | null;
  availableGenres: SerialArchiveGenreOption[];
  page: number;
  limit: number;
  hasMore: boolean;
  nextPage: number | null;
  items: SerialArchiveItem[];
};

export type SerialDetailSeason = {
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
  } | null;
};

export type SerialDetailEpisode = {
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

export type SerialSeasonDetailResponse = {
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
  episodes: SerialDetailEpisode[];
};

export type SerialDetailRatingBreakdownBucket = {
  ratingValue: number;
  count: number;
  percentage: number;
};

export type SerialDetailReviewItem = {
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
    image: string | null;
    avatarUrl: string | null;
  };
  // Present for season/episode-scoped reviews, null for a whole-series review.
  context: {
    seasonNumber: number;
    episodeNumber: number | null;
    episodeName: string | null;
  } | null;
};

export type SerialDetailUserRating = {
  diaryEntryId: string | null;
  reviewId: string | null;
  watchedDate: string | null;
  rewatch: boolean;
  rating: number | null;
  reviewContent: string | null;
  reviewContainsSpoilers: boolean | null;
};

export type SerialDetailResponse = {
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
    genres: SerialGenre[];
    globalRating: number | null;
    globalRatingVoteCount: number | null;
    inProduction: boolean | null;
    seasons: SerialDetailSeason[];
  };
  logsCount: number;
  reviewCount: number;
  userRating: SerialDetailUserRating | null;
  reviewsSort: SerialDetailReviewSort;
  reviews: SerialDetailReviewItem[];
  ratingBreakdown: {
    totalRatedReviews: number;
    averageRating: number | null;
    buckets: SerialDetailRatingBreakdownBucket[];
  };
  similar: SimilarSerialItem[];
  viewerTracking: SerialDetailViewerTracking | null;
};

export type SerialDetailViewerTracking = {
  watchedEpisodesCount: number;
  watchedEpisodes: { seasonNumber: number; episodeNumber: number }[];
  currentEpisode: { seasonNumber: number; episodeNumber: number; name: string } | null;
  ratingsCount: number;
  likesCount: number;
  reviewsCount: number;
};

export type SimilarSerialItem = {
  tmdbId: number;
  title: string;
  posterPath: string | null;
  firstAirYear: number | null;
};
