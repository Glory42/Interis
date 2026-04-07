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
  ratedLogCount: number;
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
  ratingValueOutOfFive: 1 | 2 | 3 | 4 | 5;
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

export type SerialDetailUserRating = {
  diaryEntryId: string | null;
  reviewId: string | null;
  watchedDate: string | null;
  rewatch: boolean;
  ratingOutOfTen: number | null;
  ratingOutOfFive: number | null;
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
    globalRatingOutOfTen: number | null;
    globalRatingOutOfFive: number | null;
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
    averageRatingOutOfFive: number | null;
    buckets: SerialDetailRatingBreakdownBucket[];
  };
};
