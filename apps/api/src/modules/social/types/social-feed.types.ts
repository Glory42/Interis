import { activities } from "../social.entity";
import type { MediaType } from "../../media/constants/media-type.constant";

export type ActivityType = typeof activities.$inferSelect["type"];

export type SocialActivity = typeof activities.$inferSelect;

export type ActivityRow = {
  activity: SocialActivity;
  actorId: string;
  actorUsername: string;
  actorDisplayUsername: string | null;
  actorAvatarUrl: string | null;
};

export type FeedRawMetadata = Record<string, unknown>;

export type FeedActivityKind =
  | ActivityType
  | "liked_comment"
  | "liked_post"
  | "commented_post";

export type FeedMediaType = MediaType;

export type FeedMovie = {
  tmdbId: number | null;
  title: string;
  posterPath: string | null;
  coverArtUrl?: string | null;
  releaseYear: number | null;
  mediaType: FeedMediaType;
  mbid?: string | null;
  artistName?: string | null;
  volumeId?: string | null;
  authors?: string[] | null;
};

export type FeedPostMediaType = MediaType;

export type FeedPost = {
  id: string;
  content: string;
  mediaId: number | null;
  mediaType: FeedPostMediaType | null;
};

export type FeedReview = {
  id: string;
  content: string;
  containsSpoilers: boolean;
  rating: number | null;
};

export type FeedMetadata = {
  action: string | null;
  excerpt: string | null;
  targetUsername: string | null;
  rating: number | null;
  rewatch: boolean | null;
  hasReview: boolean | null;
  mediaType: FeedMediaType | null;
  containsSpoilers: boolean | null;
  reviewId: string | null;
  commentId: string | null;
  movieId: number | null;
  mbid: string | null;
  volumeId: string | null;
  postId: string | null;
  postMediaId: number | null;
  postMediaType: FeedPostMediaType | null;
  seasonNumber: number | null;
  episodeNumber: number | null;
  listId: string | null;
  listTitle: string | null;
};

export type FeedEngagement = {
  likeCount: number;
  commentCount: number;
  viewerHasLiked: boolean | null;
};

export type FeedItem = {
  id: string;
  type: ActivityType;
  kind: FeedActivityKind;
  createdAt: Date;
  actor: {
    id: string;
    username: string;
    displayUsername: string | null;
    avatarUrl: string | null;
  };
  movie: FeedMovie | null;
  post: FeedPost | null;
  review: FeedReview | null;
  metadata: FeedMetadata;
  engagement: FeedEngagement;
};

export type ReviewFeedContext = {
  id: string;
  diaryEntryId: string | null;
  reviewAuthorUsername: string | null;
  content: string;
  containsSpoilers: boolean;
  rating: number | null;
  movie: FeedMovie;
  likeCount: number;
  commentCount: number;
  viewerHasLiked: boolean | null;
};

export type ReviewContext = {
  byReviewId: Map<string, ReviewFeedContext>;
  byDiaryEntryId: Map<string, ReviewFeedContext>;
};

export type PostEngagement = {
  likeCount: number;
  commentCount: number;
  viewerHasLiked: boolean | null;
};

export type FeedFallbackPostRow = {
  id: string;
  content: string;
  mediaId: number | null;
  mediaType: FeedPostMediaType | null;
};

export type FeedFallbackMovieRow = {
  id: number;
  tmdbId: number;
  title: string;
  posterPath: string | null;
  releaseYear: number | null;
};

export type FeedFallbackAlbumRow = {
  mbid: string;
  title: string;
  coverArtUrl: string | null;
  artistName: string;
  releaseYear: number | null;
};

export type FeedFallbackBookRow = {
  volumeId: string;
  title: string;
  coverArtUrl: string | null;
  authors: string[];
  releaseYear: number | null;
};

export type FeedFallbackMediaContext = {
  postsById: Map<string, FeedFallbackPostRow>;
  moviesById: Map<number, FeedFallbackMovieRow>;
  albumsByMbid: Map<string, FeedFallbackAlbumRow>;
  booksByVolumeId: Map<string, FeedFallbackBookRow>;
};
