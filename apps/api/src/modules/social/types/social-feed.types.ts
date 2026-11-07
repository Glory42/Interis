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

export type FeedFilm = {
  tmdbId: number;
  title: string;
  posterPath: string | null;
  releaseYear: number | null;
  mediaType: FeedMediaType;
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
  movie: FeedFilm | null;
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
  movie: FeedFilm;
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

export type FeedFallbackFilmRow = {
  id: number;
  tmdbId: number;
  title: string;
  posterPath: string | null;
  releaseYear: number | null;
};

export type FeedDiaryEntryRow = {
  id: string;
  rating: number | null;
  rewatch: boolean;
};

export type FeedListRow = {
  id: string;
  title: string;
  isPublic: boolean;
};

export type FeedUserRow = {
  id: string;
  username: string;
};

export type FeedFallbackMediaContext = {
  postsById: Map<string, FeedFallbackPostRow>;
  moviesById: Map<number, FeedFallbackFilmRow>;
  diaryEntriesById: Map<string, FeedDiaryEntryRow>;
  listsById: Map<string, FeedListRow>;
  usersById: Map<string, FeedUserRow>;
};

// One person's actions on one title (or season/episode) on one UTC day.
export type FeedTitleGroup = {
  kind: "title";
  id: string;
  createdAt: Date;
  actor: FeedItem["actor"];
  movie: FeedFilm;
  seasonNumber: number | null;
  episodeNumber: number | null;
  watched: boolean;
  rewatch: boolean;
  rating: number | null;
  liked: boolean;
  watchlisted: boolean;
  review: FeedReview | null;
  engagement: FeedEngagement;
  itemIds: string[];
};

export type GroupedFeedEntry = FeedTitleGroup | { kind: "activity"; item: FeedItem };
