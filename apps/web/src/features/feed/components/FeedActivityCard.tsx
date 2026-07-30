import { memo } from "react";
import { Link } from "@tanstack/react-router";
import { FeedActorAvatar } from "@/features/feed/components/FeedActorAvatar";
import { FeedCardHeader } from "@/features/feed/components/FeedCardHeader";
import { FeedMoviePreviewCard } from "@/features/feed/components/FeedMoviePreviewCard";
import { PostActivityCard } from "@/features/feed/components/PostActivityCard";
import { ReviewActivityCard } from "@/features/feed/components/ReviewActivityCard";
import {
  feedChannelMeta,
  inferFeedChannel,
  toSeasonEpisodeLabel,
} from "@/features/feed/components/feed-row.utils";
import type { FeedItem } from "@/features/feed/types";

type FeedActivityCardProps = {
  item: FeedItem;
};

// Tier C copy: short verb only — the attached media/list card (below)
// carries the actual title, so this never repeats it.
const getTimelineVerb = (item: FeedItem): string => {
  const seLabel = toSeasonEpisodeLabel(item);
  switch (item.kind) {
    case "diary_entry":
      return "Logged a watch";
    case "liked_movie":
      if (seLabel && item.metadata.rating !== null) return `Rated ${seLabel}`;
      return seLabel ? `Liked ${seLabel}` : "Liked a title";
    case "watchlisted_movie":
      return "Added to their watchlist";
    case "followed_user":
      return item.metadata.targetUsername
        ? `Started following @${item.metadata.targetUsername}`
        : "Followed someone";
    case "created_list":
      return "Created a new list";
    case "liked_comment":
      return "Liked a comment";
    default:
      return "Updated their activity";
  }
};

const AttachedMediaCard = ({ item }: { item: FeedItem }) => {
  if (item.kind === "created_list" && item.metadata.listId) {
    return (
      <Link
        to="/profile/$username/lists/$listId"
        params={{ username: item.actor.username, listId: item.metadata.listId }}
        className="mt-2 inline-flex max-w-xs items-center rounded-lg border border-border/50 px-3 py-2.5 transition-colors hover:bg-secondary/15"
        viewTransition
      >
        <span className="truncate text-sm font-semibold text-foreground">
          {item.metadata.listTitle ?? "a list"}
        </span>
      </Link>
    );
  }

  if (!item.movie) {
    return null;
  }

  const channel = inferFeedChannel(item);
  const accentColor = channel ? feedChannelMeta[channel].color : "var(--module-neutral)";
  const to = item.movie.mediaType === "tv" ? "/serials/$tmdbId" : "/cinema/$tmdbId";

  return (
    <FeedMoviePreviewCard
      to={to}
      tmdbId={item.movie.tmdbId}
      title={item.movie.title}
      releaseYear={item.movie.releaseYear}
      posterPath={item.movie.posterPath}
      accentColor={accentColor}
    />
  );
};

export const FeedActivityCard = memo(function FeedActivityCard({ item }: FeedActivityCardProps) {
  if (item.kind === "post" || item.kind === "liked_post" || item.kind === "commented_post") {
    return <PostActivityCard item={item} />;
  }

  if (
    item.kind === "review" ||
    item.kind === "liked_review" ||
    item.kind === "commented" ||
    (item.kind === "diary_entry" && item.review)
  ) {
    return <ReviewActivityCard item={item} />;
  }

  // Tier C: a Twitter-shaped timeline entry — avatar, name + time header, a
  // plain verb line, an optional attached-media card. No like/comment here —
  // those are reserved for posts and reviews, the only kinds that carry
  // actual authored content.
  const actorName = item.actor.displayUsername ?? item.actor.username;
  const actorInitial = item.actor.username.slice(0, 1).toUpperCase();
  const actorAvatar = item.actor.avatarUrl ?? null;

  return (
    <article className="-mx-2 flex gap-3 rounded-xl px-3 py-3.5 transition-colors hover:bg-foreground/[0.025]">
      <FeedActorAvatar
        avatarUrl={actorAvatar}
        username={item.actor.username}
        initial={actorInitial}
        className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden text-sm font-bold text-foreground"
        style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))" }}
      />

      <div className="min-w-0 flex-1">
        <FeedCardHeader
          username={item.actor.username}
          displayName={actorName}
          createdAt={item.createdAt}
        />

        <p className="mt-0.5 text-[15px] leading-snug text-foreground/90">
          {getTimelineVerb(item)}
        </p>

        <AttachedMediaCard item={item} />
      </div>
    </article>
  );
});
