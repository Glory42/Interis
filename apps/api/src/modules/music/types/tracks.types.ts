import type { TrackDetailReviewSort } from "../dto/tracks.dto";

export type TrackDetail = {
  id: number;
  mbid: string;
  title: string;
  artistName: string;
  length: number | null;
  disambiguation: string | null;
  previewUrl: string | null;
};

export type TrackInteraction = {
  liked: boolean;
  wantToListen: boolean;
  rating: number | null;
};

export type TrackDetailUserLog = {
  diaryEntryId: string | null;
  listenedDate: string | null;
  relisten: boolean;
  rating: number | null;
};

export type TrackDetailReviewItem = {
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

export type TrackDetailResponse = {
  track: TrackDetail;
  logsCount: number;
  reviewCount: number;
  userLog: TrackDetailUserLog | null;
  interaction: TrackInteraction | null;
  reviewsSort: TrackDetailReviewSort;
  reviews: TrackDetailReviewItem[];
};
