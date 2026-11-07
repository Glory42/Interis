import { truncateExcerpt } from "../../../commons/helpers/text.helper";
import { isUuid } from "../../../commons/helpers/uuid.helper";
import {
  parseMetadata,
  readNumber,
  readPostMediaType,
  readString,
  resolveActivityKind,
  toFeedMediaType,
  toFeedMetadata,
} from "./social-feed-metadata.helper";
import type {
  ActivityRow,
  FeedEngagement,
  FeedFilm,
  FeedItem,
  FeedMetadata,
  ReviewFeedContext,
} from "../types/social-feed.types";
import type { FeedContext, FeedIds, FeedKind, ParsedActivity } from "../types/social-feed-kind.types";

// The pieces of a feed item every kind builds the same way. Metadata keeps a
// copy of the text from when the activity was recorded, but it must never stand
// in for deleted content.

export const parseActivity = (row: ActivityRow): ParsedActivity => {
  const raw = parseMetadata(row.activity.metadata);
  const metadata = toFeedMetadata(raw);
  return { row, activity: row.activity, raw, metadata, kind: resolveActivityKind(row.activity.type, metadata.action) };
};

// A post's own id, or the post its metadata names (a like or comment on it).
const postIdOf = ({ activity, raw }: ParsedActivity): string | null => {
  const fromMetadata = readString(raw, "postId");
  if (activity.type !== "post" && !fromMetadata) {
    return null;
  }
  return fromMetadata ?? activity.entityId;
};

const embeddedFilm = ({ raw }: ParsedActivity): FeedFilm | null => {
  const tmdbId = readNumber(raw, "tmdbId");
  const title = readString(raw, "title");
  if (tmdbId === null || !title) {
    return null;
  }
  return {
    tmdbId,
    title,
    posterPath: readString(raw, "posterPath"),
    releaseYear: readNumber(raw, "releaseYear"),
    mediaType: toFeedMediaType(readPostMediaType(raw, "mediaType")) ?? "movie",
  };
};

// The film row to load when the metadata doesn't embed the film itself.
const filmIdOf = (parsed: ParsedActivity): number | null => {
  if (embeddedFilm(parsed)) {
    return null;
  }
  const { activity, metadata } = parsed;
  const filmId =
    metadata.movieId ??
    (metadata.postMediaType === "movie" ? metadata.postMediaId : null) ??
    (activity.type === "liked_movie" || activity.type === "watchlisted_movie"
      ? Number.parseInt(activity.entityId, 10)
      : null);
  return !filmId || Number.isNaN(filmId) ? null : filmId;
};

const filmOf = (parsed: ParsedActivity, context: FeedContext): FeedFilm | null => {
  const embedded = embeddedFilm(parsed);
  if (embedded) {
    return embedded;
  }
  const filmId = filmIdOf(parsed);
  const film = filmId === null ? undefined : context.films.get(filmId);
  return film
    ? { tmdbId: film.tmdbId, title: film.title, posterPath: film.posterPath, releaseYear: film.releaseYear, mediaType: "movie" }
    : null;
};

export const addUuid = (set: Set<string>, id: string | null): void => {
  if (id && isUuid(id)) {
    set.add(id);
  }
};

// The ids every kind may need: the post and film it shows and the review it names.
export const collectShared = (parsed: ParsedActivity, ids: FeedIds, reviewId: string | null): void => {
  addUuid(ids.reviews, reviewId);
  addUuid(ids.posts, postIdOf(parsed));
  const filmId = filmIdOf(parsed);
  if (filmId !== null) {
    ids.films.add(filmId);
  }
};

// Dead when the review or post the activity is about has been deleted.
export const sharedContentGone = (parsed: ParsedActivity, context: FeedContext, reviewId: string | null): boolean => {
  const postId = postIdOf(parsed);
  return (reviewId !== null && !context.reviews.byReviewId.has(reviewId)) || (postId !== null && !context.posts.has(postId));
};

export const reviewById = (context: FeedContext, reviewId: string | null): ReviewFeedContext | null =>
  (reviewId ? context.reviews.byReviewId.get(reviewId) : null) ?? null;

// The live review's text and flags in place of the activity's copy, so an
// edited or deleted review never shows its old text.
export const liveReviewMetadata = (review: ReviewFeedContext | null): Partial<FeedMetadata> => ({
  hasReview: review !== null,
  reviewId: review?.id ?? null,
  containsSpoilers: review?.containsSpoilers ?? null,
  excerpt: review ? truncateExcerpt(review.content) : null,
});

const noEngagement = (): FeedEngagement => ({ likeCount: 0, commentCount: 0, viewerHasLiked: null });

export const projectItem = (
  parsed: ParsedActivity,
  context: FeedContext,
  parts: { review: ReviewFeedContext | null; metadata?: Partial<FeedMetadata> },
): FeedItem => {
  const { activity, row, metadata } = parsed;
  const { review } = parts;
  const postId = postIdOf(parsed);
  const postRow = postId ? context.posts.get(postId) : undefined;
  const post = postRow
    ? { id: postRow.id, content: postRow.content, mediaId: postRow.mediaId, mediaType: postRow.mediaType }
    : null;

  // Likes and comments belong to the review or post shown, else to the activity itself.
  const engagement: FeedEngagement = review
    ? { likeCount: review.likeCount, commentCount: review.commentCount, viewerHasLiked: review.viewerHasLiked }
    : post
      ? context.postEngagement.get(post.id) ?? noEngagement()
      : context.activityEngagement.get(activity.id) ?? noEngagement();

  return {
    id: activity.id,
    type: activity.type,
    kind: parsed.kind,
    createdAt: activity.createdAt,
    actor: {
      id: row.actorId,
      username: row.actorUsername,
      displayUsername: row.actorDisplayUsername,
      avatarUrl: row.actorAvatarUrl,
    },
    movie: review?.movie ?? filmOf(parsed, context),
    post,
    review: review
      ? { id: review.id, content: review.content, containsSpoilers: review.containsSpoilers, rating: review.rating }
      : null,
    metadata: {
      ...metadata,
      ...parts.metadata,
      targetUsername:
        parts.metadata?.targetUsername ?? metadata.targetUsername ?? review?.reviewAuthorUsername ?? null,
    },
    engagement,
  };
};

// Kinds about no review or log of their own: the review and post their metadata names.
export const contentKind: FeedKind = {
  collect: (parsed, ids) => collectShared(parsed, ids, parsed.metadata.reviewId),
  isDead: (parsed, context) => sharedContentGone(parsed, context, parsed.metadata.reviewId),
  project: (parsed, context) => projectItem(parsed, context, { review: reviewById(context, parsed.metadata.reviewId) }),
};
