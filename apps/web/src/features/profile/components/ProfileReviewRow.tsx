import { memo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { RocketDisplay } from "@/components/film/rating/RocketDisplay";
import { toIsoWeek } from "@/features/media/archive/week-label";
import { getPosterUrl } from "@/features/movies/components/utils";
import type { UserReview } from "@/features/profile/api";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const kickerFor = (review: UserReview) => {
  const kind = review.mediaType === "tv" ? "Series" : "Film";
  const date = new Date(review.createdAt);
  if (Number.isNaN(date.getTime())) return `${kind} · reviewed`;
  return `${kind} · reviewed ${WEEKDAYS[date.getDay()]} ${MONTHS[date.getMonth()]} ${date.getDate()} · WK ${toIsoWeek(date)}`;
};

// One review in a hairline row: dated kicker, title and rockets, then the review as a serif quote.
export const ProfileReviewRow = memo(function ProfileReviewRow({ review, username }: { review: UserReview; username: string }) {
  const [isRevealed, setIsRevealed] = useState(false);
  const to = review.mediaType === "tv" ? "/serials/$tmdbId" : "/movies/$tmdbId";
  const isTv = review.mediaType === "tv";

  return (
    <article className="flex items-start gap-3.5 border-b border-[color:var(--line)] py-3.5 last:border-b-0">
      <Link to={to} params={{ tmdbId: String(review.tmdbId) }} className="shrink-0" viewTransition>
        <img src={getPosterUrl(review.posterPath)} alt="" className="aspect-2/3 w-14 rounded-[2px] object-cover" loading="lazy" />
      </Link>
      <div className="min-w-0 flex-1">
        <p className={`kicker ${isTv ? "text-[color:var(--series)]" : "text-[color:var(--film)]"}`}>{kickerFor(review)}</p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2">
          <Link to={to} params={{ tmdbId: String(review.tmdbId) }} className="display-4 text-foreground hover:underline" viewTransition>
            {review.title}
            {review.releaseYear ? <span className="mono-meta ml-1.5 font-normal text-muted-foreground">{review.releaseYear}</span> : null}
          </Link>
          {review.rating != null ? <RocketDisplay rating={review.rating} size="sm" /> : null}
        </p>
        {review.containsSpoilers && !isRevealed ? (
          <button type="button" onClick={() => setIsRevealed(true)} className="mono-meta mt-2 uppercase text-[color:var(--warning)] hover:underline">
            ⚠ Spoilers · reveal
          </button>
        ) : (
          <p className="tagline mt-1.5 text-lg text-foreground">{`“${review.content}”`}</p>
        )}
        <Link
          to="/reviews/$username/$reviewId"
          params={{ username, reviewId: review.id }}
          className="mono-meta mt-2 inline-block uppercase text-muted-foreground hover:text-foreground"
          viewTransition
        >
          Read →
        </Link>
      </div>
    </article>
  );
});
