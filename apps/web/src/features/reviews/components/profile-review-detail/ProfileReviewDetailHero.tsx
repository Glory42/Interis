import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { DuotoneBackdrop } from "@/components/film/DuotoneBackdrop";
import { RocketDisplay } from "@/components/film/rating/RocketDisplay";
import { toIsoWeek } from "@/features/media/archive/week-label";
import type { ReviewDetail } from "@/features/reviews/api";
import { getPosterUrl } from "@/features/media/tmdb-images";

type ProfileReviewDetailHeroProps = {
  username: string;
  detail: ReviewDetail;
  displayAuthorName: string;
  authorAvatar: string | null;
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Opening credit for a review: slate, duotone frame with the title, then who reviewed it and their score.
export const ProfileReviewDetailHero = ({ username, detail, displayAuthorName, authorAvatar }: ProfileReviewDetailHeroProps) => {
  const isTv = detail.mediaType === "tv";
  const reviewed = new Date(detail.createdAt);
  const hasDate = !Number.isNaN(reviewed.getTime());
  const credit = isTv
    ? detail.media.creator && `Created by ${detail.media.creator}`
    : detail.media.director && `Directed by ${detail.media.director}`;
  const slate = ["Review", isTv ? "TV" : "Film", detail.media.releaseYear ? String(detail.media.releaseYear) : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <section className="mx-auto w-full max-w-5xl px-4 pt-6">
      <Link
        to="/profile/$username/reviews"
        params={{ username }}
        className="mono-meta mb-3 inline-flex items-center gap-1.5 uppercase text-muted-foreground hover:text-foreground"
        viewTransition
      >
        <ArrowLeft aria-hidden className="size-3" />
        Reviews
      </Link>

      <div className="overflow-hidden rounded-[3px] border border-[color:var(--line)]">
        <div className="slate mono-meta uppercase">
          <span>{slate}</span>
          {hasDate ? <span>{`WK ${toIsoWeek(reviewed)}`}</span> : null}
        </div>
        <Link
          to={isTv ? "/serials/$tmdbId" : "/movies/$tmdbId"}
          params={{ tmdbId: String(detail.media.tmdbId) }}
          className="relative block h-40 sm:h-48"
          viewTransition
        >
          <DuotoneBackdrop tone={isTv ? "series" : "film"} fade={false}>
            <img src={getPosterUrl(detail.media.posterPath)} alt="" className="size-full object-cover object-[center_40%]" />
          </DuotoneBackdrop>
          <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute right-4 bottom-3 left-4">
            {credit ? <p className="mono-meta uppercase text-white/80">{credit}</p> : null}
            <h1 className="display-2 leading-tight text-white">
              {detail.media.title}
              {detail.media.releaseYear ? <span className="ml-2 text-base font-normal text-white/70">({detail.media.releaseYear})</span> : null}
            </h1>
          </div>
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
        {authorAvatar ? (
          <img src={authorAvatar} alt="" className="size-7 rounded-full object-cover" />
        ) : (
          <span className="inline-flex size-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            {detail.author.username.slice(0, 1).toLowerCase()}
          </span>
        )}
        <Link to="/profile/$username" params={{ username: detail.author.username }} className="text-sm font-semibold text-foreground hover:underline" viewTransition>
          {displayAuthorName}
        </Link>
        {hasDate ? (
          <span className="body-s text-muted-foreground">{`reviewed it ${WEEKDAYS[reviewed.getDay()]} ${MONTHS[reviewed.getMonth()]} ${reviewed.getDate()}`}</span>
        ) : null}
        {detail.rating !== null ? (
          <span className="flex items-center gap-2">
            <RocketDisplay rating={detail.rating} size="sm" />
            <b className="mono-meta text-primary">{`${detail.rating}/10`}</b>
          </span>
        ) : null}
      </div>
    </section>
  );
};
