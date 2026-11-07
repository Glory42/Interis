import { memo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { RocketDisplay } from "@/components/film/rating/RocketDisplay";
import { EditButton, LikeButton } from "@/features/feed/components/EngagementActionBar";
import { FeedReviewEditDialog } from "@/features/feed/components/FeedReviewEditDialog";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { getPosterUrl } from "@/features/movies/components/utils";
import { useLikeReview, useUnlikeReview } from "@/features/reviews/hooks/useReviews";
import type { FeedTitleGroup } from "@/features/feed/types";
import { verbFor } from "@/features/feed/components/feed-days";

const pad = (value: number) => String(value).padStart(2, "0");

const ReviewLike = ({ reviewId, engagement }: { reviewId: string; engagement: FeedTitleGroup["engagement"] }) => {
  const like = useLikeReview(reviewId);
  const unlike = useUnlikeReview(reviewId);
  // Shown optimistically from the pending mutation; the feed refetches once it settles.
  const isLiked = like.isPending ? true : unlike.isPending ? false : Boolean(engagement.viewerHasLiked);
  const count =
    engagement.likeCount + (like.isPending && !engagement.viewerHasLiked ? 1 : 0) - (unlike.isPending && engagement.viewerHasLiked ? 1 : 0);

  return (
    <LikeButton
      count={count}
      isLiked={isLiked}
      isPending={false}
      onToggle={() => (isLiked ? unlike.mutate() : like.mutate())}
    />
  );
};

// One watch, one card: who, when, the title, the score, the like and the review.
export const FeedTitleCard = memo(function FeedTitleCard({ group }: { group: FeedTitleGroup }) {
  const [showSpoilers, setShowSpoilers] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { user } = useAuth();
  const { actor, movie, review } = group;
  const isOwnReview = Boolean(review && user && user.id === actor.id);
  const createdAt = new Date(group.createdAt);
  const isTv = movie.mediaType === "tv";
  const episodeLabel =
    group.seasonNumber !== null
      ? [`S${pad(group.seasonNumber)}`, group.episodeNumber !== null ? `E${pad(group.episodeNumber)}` : null]
          .filter(Boolean)
          .join(" · ")
      : null;

  return (
    <article className="flex items-start gap-3 rounded-[3px] border border-[color:var(--line)] bg-card p-3">
      <img
        src={getPosterUrl(movie.posterPath)}
        alt=""
        className="aspect-2/3 w-[62px] shrink-0 rounded-[2px] border border-[color:var(--line)] object-cover"
        loading="lazy"
      />
      <div className="min-w-0 flex-1">
        <p className="flex items-baseline gap-1.5 text-xs">
          <Link to="/profile/$username" params={{ username: actor.username }} className="font-semibold text-foreground">
            {actor.username}
          </Link>
          <span className="text-muted-foreground">{verbFor(group)}</span>
          <time dateTime={group.createdAt} className="mono-meta ml-auto text-[color:var(--faint)]">
            {`${pad(createdAt.getHours())}:${pad(createdAt.getMinutes())}`}
          </time>
        </p>
        <Link
          to={isTv ? "/serials/$tmdbId" : "/movies/$tmdbId"}
          params={{ tmdbId: String(movie.tmdbId) }}
          className="display-4 mt-0.5 block text-foreground hover:underline"
        >
          {movie.title}
          {movie.releaseYear ? <span className="mono-meta ml-1.5 font-normal text-muted-foreground">{movie.releaseYear}</span> : null}
        </Link>
        {episodeLabel ? <p className="mono-meta text-muted-foreground">{episodeLabel}</p> : null}

        {group.rating !== null || group.liked ? (
          <p className="mt-1 flex items-center gap-2">
            {group.rating !== null ? (
              <>
                <RocketDisplay rating={group.rating} size="sm" />
                <span className="mono-meta text-muted-foreground">{`${group.rating}/10`}</span>
              </>
            ) : null}
            {group.liked ? (
              <span aria-label="Liked" className="text-[color:var(--like)]">
                ♥
              </span>
            ) : null}
          </p>
        ) : null}

        {review ? (
          <>
            {review.containsSpoilers && !showSpoilers ? (
              <button type="button" onClick={() => setShowSpoilers(true)} className="body-s mt-2 text-muted-foreground underline">
                Show spoilers
              </button>
            ) : (
              <Link
                to="/reviews/$username/$reviewId"
                params={{ username: actor.username, reviewId: review.id }}
                className="tagline mt-2 block text-foreground hover:underline hover:decoration-[color:var(--line-strong)]"
                viewTransition
              >
                {`“${review.content}”`}
              </Link>
            )}
            <div className="mono-meta mt-2 flex items-center gap-4 text-[color:var(--faint)]">
              <ReviewLike reviewId={review.id} engagement={group.engagement} />
              <Link
                to="/reviews/$username/$reviewId"
                params={{ username: actor.username, reviewId: review.id }}
                className="uppercase hover:text-foreground"
              >
                Reply
              </Link>
              {isOwnReview ? <EditButton onClick={() => setIsEditing(true)} /> : null}
            </div>
            <FeedReviewEditDialog
              isOpen={isEditing}
              onClose={() => setIsEditing(false)}
              reviewId={review.id}
              initialContent={review.content}
              containsSpoilers={review.containsSpoilers}
            />
          </>
        ) : null}
      </div>
    </article>
  );
});
