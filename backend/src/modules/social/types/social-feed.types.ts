import { activities } from "../social.entity";

export type ActivityType = typeof activities.$inferSelect["type"];

export type SocialActivity = typeof activities.$inferSelect;

export type ActivityRow = {
  activity: SocialActivity;
  actorId: string;
  actorUsername: string;
  actorDisplayUsername: string | null;
  actorImage: string | null;
  actorAvatarUrl: string | null;
};

export type FeedRawMetadata = Record<string, unknown>;

export type FeedActivityKind =
  | ActivityType
  | "liked_comment"
  | "liked_post"
  | "commented_post";

export type FeedMovie = {
  tmdbId: number;
  title: string;
  posterPath: string | null;
  releaseYear: number | null;
};

export type FeedPostMediaType = "movie" | "tv" | "book" | "music";

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
  containsSpoilers: boolean | null;
  reviewId: string | null;
  commentId: string | null;
  movieId: number | null;
  postId: string | null;
  postMediaId: number | null;
  postMediaType: FeedPostMediaType | null;
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
    image: string | null;
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
};
