export type PublicRecentQueryDto = {
  limit?: string;
};

export type PublicActivityQueryDto = {
  limit?: string;
};

export type PublicCollectionQueryDto = {
  limit?: string;
};

export type PublicDiaryQueryDto = {
  limit?: string;
  offset?: string;
};

export type PublicProfileResponse = {
  username: string;
  displayUsername: string | null;
  name: string;
  image: string | null;
  avatarUrl: string | null;
  bio: string | null;
  location: string | null;
  favoriteGenres: string[];
  themeId: string;
  createdAt: Date;
  stats: {
    filmEntryCount: number;
    serialEntryCount: number;
    reviewCount: number;
    filmCount: number;
    listCount: number;
    followerCount: number;
    followingCount: number;
  };
};

export type PublicDiaryItem = {
  id: string;
  mediaType: "movie" | "tv";
  watchedDate: string;
  rating: number | null;
  rewatch: boolean;
  createdAt: Date;
  updatedAt: Date;
  media: {
    tmdbId: number;
    title: string;
    posterPath: string | null;
    releaseYear: number | null;
  };
  review: {
    id: string;
    content: string;
    containsSpoilers: boolean;
    createdAt: Date;
  } | null;
};

export type PublicCurrentlyWatchingQueryDto = {
  limit?: string;
};

export type PublicCurrentlyWatchingSeries = {
  tmdbId: number;
  title: string;
  posterPath: string | null;
  backdropPath: string | null;
  firstAirYear: number | null;
  numberOfSeasons: number | null;
  numberOfEpisodes: number | null;
  watchedEpisodesCount: number;
  progressPercent: number;
  lastWatchedAt: Date;
  currentEpisode: { seasonNumber: number; episodeNumber: number; name: string } | null;
};

export type PublicListEntry = {
  position: number;
  note: string | null;
  tmdbId: number;
  title: string;
  posterPath: string | null;
  releaseYear: number | null;
};

export type PublicList = {
  id: string;
  title: string;
  description: string | null;
  isRanked: boolean;
  createdAt: Date;
  updatedAt: Date;
  itemCount: number;
  items: PublicListEntry[];
};
