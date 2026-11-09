import type { MouseEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { RocketDisplay } from "@/components/film/rating/RocketDisplay";
import { episodesSummary, titleRoute, verbFor } from "@/features/feed/components/feed-days";
import { EpisodeList, FollowsLine, TitlesLine } from "@/features/feed/components/FeedFoldedRows";
import type { FeedItem, FeedRow } from "@/features/feed/types";
import { getPosterUrl } from "@/features/media/tmdb-images";
import { isCardBackgroundClick } from "@/lib/card-click";
import { LikeMark } from "@/components/ui/LikeMark";

const ACTIVITY_LINES: Partial<Record<FeedItem["kind"], string>> = {
  watchlisted_movie: "Added to watchlist",
  created_list: "Created a list",
  followed_user: "Followed",
  post: "Posted",
  liked_review: "Liked a review",
  commented: "Commented on a review",
};

// One row on one line or a small poster row, for the profile overview.
export const FeedCompactRow = ({ row }: { row: FeedRow }) => {
  const navigate = useNavigate();

  if (row.kind === "titles") return <TitlesLine row={row} variant="compact" />;
  if (row.kind === "follows") return <FollowsLine row={row} variant="compact" />;

  if (row.kind === "episodes") {
    return (
      <div className="flex items-start gap-3">
        <img src={getPosterUrl(row.movie.posterPath)} alt="" className="aspect-2/3 w-9 shrink-0 rounded-[2px] object-cover" loading="lazy" />
        <div className="min-w-0">
          <p className="kicker text-[color:var(--series)]">{`Series · ${episodesSummary(row.groups)}`}</p>
          <Link to="/serials/$tmdbId" params={{ tmdbId: String(row.movie.tmdbId) }} className="display-4 text-foreground hover:underline">
            {row.movie.title}
          </Link>
          <EpisodeList groups={row.groups} />
        </div>
      </div>
    );
  }

  if (row.kind === "activity") {
    const { item } = row;
    return (
      <p className="body-s flex flex-wrap items-baseline gap-x-2 text-muted-foreground">
        <span>{ACTIVITY_LINES[item.kind] ?? "Updated their activity"}</span>
        {item.movie ? (
          <Link to={titleRoute(item.movie.mediaType)} params={{ tmdbId: String(item.movie.tmdbId) }} className="font-semibold text-foreground hover:underline">
            {item.movie.title}
          </Link>
        ) : item.metadata.listTitle ? (
          <span className="user-text text-foreground">{item.metadata.listTitle}</span>
        ) : item.metadata.targetUsername ? (
          <span className="text-foreground">{`@${item.metadata.targetUsername}`}</span>
        ) : null}
      </p>
    );
  }

  const { group } = row;
  const isTv = group.movie.mediaType === "tv";
  const { review } = group;
  // A row with a review opens it from anywhere on the row.
  const openReview = (event: MouseEvent<HTMLElement>) => {
    if (!review || !isCardBackgroundClick(event)) return;
    void navigate({
      to: "/reviews/$username/$reviewId",
      params: { username: group.actor.username, reviewId: review.id },
      viewTransition: true,
    });
  };
  return (
    <div onClick={openReview} className={`flex items-start gap-3 ${review ? "cursor-pointer" : ""}`}>
      <img src={getPosterUrl(group.movie.posterPath)} alt="" className="aspect-2/3 w-9 shrink-0 rounded-[2px] object-cover" loading="lazy" />
      <div className="min-w-0">
        <p className={`kicker ${isTv ? "text-[color:var(--series)]" : "text-[color:var(--film)]"}`}>
          {`${isTv ? "Series" : "Film"} · ${verbFor(group)}`}
        </p>
        <p className="flex flex-wrap items-center gap-x-2">
          <Link to={titleRoute(group.movie.mediaType)} params={{ tmdbId: String(group.movie.tmdbId) }} className="display-4 text-foreground hover:underline">
            {group.movie.title}
            {group.movie.releaseYear ? <span className="mono-meta ml-1.5 font-normal text-muted-foreground">{group.movie.releaseYear}</span> : null}
          </Link>
          {group.rating !== null ? <RocketDisplay rating={group.rating} size="sm" /> : null}
          {group.liked ? <LikeMark /> : null}
          {group.review ? <span aria-label="Reviewed" className="text-primary">✎</span> : null}
        </p>
        {group.review && !group.review.containsSpoilers ? (
          <Link
            to="/reviews/$username/$reviewId"
            params={{ username: group.actor.username, reviewId: group.review.id }}
            className="user-text tagline mt-0.5 line-clamp-2 text-foreground hover:underline hover:decoration-[color:var(--line-strong)]"
            viewTransition
          >
            {`“${group.review.content}”`}
          </Link>
        ) : null}
      </div>
    </div>
  );
};
