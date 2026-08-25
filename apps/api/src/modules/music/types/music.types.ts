import type { MusicArchiveSort, MusicDetailReviewSort } from "../dto/music.dto";

export type AlbumGenreTag = { name: string; count: number };

export type AlbumDetail = {
  id: number;
  mbid: string;
  title: string;
  artistName: string;
  artistMbid: string | null;
  coverArtUrl: string | null;
  primaryType: string | null;
  secondaryTypes: string[];
  firstReleaseDate: string | null;
  firstReleaseYear: number | null;
  genres: AlbumGenreTag[];
  disambiguation: string | null;
};

export type MusicArchiveItem = {
  mbid: string;
  title: string;
  artistName: string;
  coverArtUrl: string | null;
  primaryType: string | null;
  firstReleaseYear: number | null;
  genres: AlbumGenreTag[];
  logCount: number;
  avgRating: number | null;
  viewerHasLogged: boolean;
  viewerWantToListen: boolean;
};

export type GenreOption = { name: string; count: number };

export type MusicArchiveResponse = {
  totalCount: number;
  filteredCount: number;
  selectedGenre: string | null;
  selectedSort: MusicArchiveSort;
  availableGenres: GenreOption[];
  page: number;
  limit: number;
  hasMore: boolean;
  nextPage: number | null;
  items: MusicArchiveItem[];
};

export type MusicLogItem = {
  diaryEntryId: string;
  listenedDate: string;
  rating: number | null;
  relisten: boolean;
  createdAt: Date;
  username: string;
  userDisplayName: string | null;
  avatarUrl: string | null;
  reviewContent: string | null;
  reviewContainsSpoilers: boolean | null;
  reviewUpdatedAt: Date | null;
};

export type MusicInteraction = {
  liked: boolean;
  wantToListen: boolean;
  rating: number | null;
};

export type MusicDetailUserLog = {
  diaryEntryId: string | null;
  listenedDate: string | null;
  relisten: boolean;
  rating: number | null;
};

export type MusicDetailReviewItem = {
  id: string;
  content: string;
  containsSpoilers: boolean;
  createdAt: Date;
  updatedAt: Date;
  listenedDate: string | null;
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

export type MusicDetailResponse = {
  album: AlbumDetail;
  logsCount: number;
  reviewCount: number;
  userLog: MusicDetailUserLog | null;
  interaction: MusicInteraction | null;
  reviewsSort: MusicDetailReviewSort;
  reviews: MusicDetailReviewItem[];
};

export type MyMusicLogEntry = {
  id: string;
  listenedDate: string;
  rating: number | null;
  relisten: boolean;
  albumId: number;
  createdAt: Date;
  updatedAt: Date;
  albumMbid: string;
  albumTitle: string;
  albumArtistName: string;
  albumCoverArtUrl: string | null;
  albumFirstReleaseYear: number | null;
  reviewId: string | null;
  reviewContent: string | null;
};
