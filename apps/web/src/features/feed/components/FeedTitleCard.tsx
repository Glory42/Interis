import { memo, useState, type MouseEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { RocketDisplay } from "@/components/film/rating/RocketDisplay";
import { EditButton, LikeButton } from "@/features/feed/components/EngagementActionBar";
import { FeedTitleEditDialog } from "@/features/feed/components/FeedTitleEditDialog";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useLikeReview, useUnlikeReview } from "@/features/reviews/hooks/useReviews";
import type { FeedTitleGroup } from "@/features/feed/types";
import { verbFor, watchedDayLabel } from "@/features/feed/components/feed-days";
import { getPosterUrl } from "@/features/media/tmdb-images";
import { isCardBackgroundClick } from "@/lib/card-click";

const pad = (value: number) => String(value).padStart(2, "0");

// The like mutations patch the feed cache, so the engagement here is already optimistic.
const ReviewLike = ({ reviewId, engagement }: { reviewId: string; engagement: FeedTitleGroup["engagement"] }) => {
  const like = useLikeReview(reviewId);
  const unlike = useUnlikeReview(reviewId);
  const isLiked = Boolean(engagement.viewerHasLiked);

  return (
    <LikeButton
      count={engagement.likeCount}
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
  const navigate = useNavigate();
  const { actor, movie, review } = group;
  const isOwn = Boolean(user && user.id === actor.id);
  const canEdit = isOwn && (group.log !== null || review !== null);
  const watchedLabel = watchedDayLabel(group);
  const createdAt = new Date(group.createdAt);
  const isTv = movie.mediaType === "tv";
  const episodeLabel =
    group.seasonNumber !== null
      ? [`S${pad(group.seasonNumber)}`, group.episodeNumber !== null ? `E${pad(group.episodeNumber)}` : null]
          .filter(Boolean)
          .join(" · ")
      : null;

  // The whole card opens the review, or the title when there's no review.
  const openCard = (event: MouseEvent<HTMLElement>) => {
    if (!isCardBackgroundClick(event)) return;
    if (review) {
      void navigate({
        to: "/reviews/$username/$reviewId",
        params: { username: actor.username, reviewId: review.id },
        viewTransition: true,
      });
      return;
    }
    void navigate({
      to: isTv ? "/serials/$tmdbId" : "/movies/$tmdbId",
      params: { tmdbId: String(movie.tmdbId) },
      viewTransition: true,
    });
  };

  return (
    <article
      onClick={openCard}
      className="flex cursor-pointer items-start gap-3 rounded-[3px] border border-[color:var(--line)] bg-card p-3 transition-colors hover:border-[color:var(--line-strong)]"
    >
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
          <time
            dateTime={group.createdAt}
            title={`Logged ${createdAt.toLocaleString()}`}
            className="mono-meta ml-auto text-[color:var(--faint)]"
          >
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
        {episodeLabel || watchedLabel ? (
          <p className="mono-meta uppercase text-muted-foreground">
            {[episodeLabel, watchedLabel].filter(Boolean).join(" · ")}
          </p>
        ) : null}

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
              {canEdit ? <EditButton onClick={() => setIsEditing(true)} /> : null}
            </div>
          </>
        ) : canEdit ? (
          <div className="mono-meta mt-2 flex items-center gap-4 text-[color:var(--faint)]">
            <EditButton onClick={() => setIsEditing(true)} />
          </div>
        ) : null}
        {isEditing ? <FeedTitleEditDialog group={group} onClose={() => setIsEditing(false)} /> : null}
      </div>
    </article>
  );
});
