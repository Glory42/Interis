import type { CSSProperties } from "react";
import { Link } from "@tanstack/react-router";
import { CornerDownRight, Heart, MessageSquare, Star } from "lucide-react";
import { FeedActorAvatar } from "@/features/feed/components/FeedActorAvatar";
import { PostActivityCard } from "@/features/feed/components/PostActivityCard";
import { ReviewActivityCard } from "@/features/feed/components/ReviewActivityCard";
import {
  feedChannelMeta,
  getRatingOutOfFive,
  getRelativeTime,
  getRoundedStars,
  inferFeedChannel,
} from "@/features/feed/components/feed-row.utils";
import type { FeedItem } from "@/features/feed/types";
import { cn } from "@/lib/utils";

type FeedActivityCardProps = {
  item: FeedItem;
};

const getActivityCopy = (item: FeedItem): string => {
  switch (item.kind) {
    case "diary_entry":
      return "logged a watch entry";
    case "review":
      return "published a review";
    case "commented":
      return "commented on a review";
    case "liked_review":
      return "liked a review";
    case "liked_comment":
      return "liked a comment";
    case "liked_post":
      return "liked a post";
    case "commented_post":
      return "commented on a post";
    case "liked_movie":
      return "liked a title";
    case "watchlisted_movie":
      return "updated watchlist";
    case "followed_user":
      return item.metadata.targetUsername
        ? `followed @${item.metadata.targetUsername}`
        : "followed someone";
    case "created_list":
      return "created a list";
    default:
      return "updated activity";
  }
};

const renderAttachedTitle = (item: FeedItem) => {
  if (!item.movie) {
    return <span className="font-mono text-xs font-bold text-foreground">{getActivityCopy(item)}</span>;
  }

  const to = item.movie.mediaType === "tv" ? "/serials/$tmdbId" : "/cinema/$tmdbId";

  return (
    <>
      <Link
        to={to}
        params={{ tmdbId: String(item.movie.tmdbId) }}
        className="line-clamp-1 font-mono text-xs font-bold text-foreground hover:text-primary"
        viewTransition
      >
        {item.movie.title}
      </Link>
      {item.movie.releaseYear ? (
        <span className="font-mono text-[10px] text-muted-foreground">
          {item.movie.releaseYear}
        </span>
      ) : null}
    </>
  );
};

export const FeedActivityCard = ({ item }: FeedActivityCardProps) => {
  if (item.kind === "post" || item.kind === "liked_post" || item.kind === "commented_post") {
    return <PostActivityCard item={item} />;
  }

  if (item.kind === "review" || (item.kind === "diary_entry" && item.review)) {
    return <ReviewActivityCard item={item} />;
  }

  const channel = inferFeedChannel(item);
  const channelLabel = channel ? feedChannelMeta[channel].label : "FEED";
  const channelColor = channel ? feedChannelMeta[channel].color : "var(--module-neutral)";
  const channelTint = channel ? feedChannelMeta[channel].tint : "rgba(156, 163, 175, 0.08)";
  const actorName = item.actor.displayUsername ?? item.actor.username;
  const actorInitial = item.actor.username.slice(0, 1).toUpperCase();
  const actorAvatar = item.actor.avatarUrl ?? item.actor.image ?? null;
  const ratingOutOfFive = getRatingOutOfFive(item.metadata.rating);
  const filledStars = getRoundedStars(ratingOutOfFive);

  const channelStyle = {
    borderColor: `color-mix(in srgb, ${channelColor} 36%, transparent)`,
    background: channelTint,
    color: channelColor,
  } satisfies CSSProperties;

  return (
    <article className="group border-b border-border/60 py-6">
      <div className="flex items-center gap-3">
        <FeedActorAvatar
          avatarUrl={actorAvatar}
          username={item.actor.username}
          initial={actorInitial}
          style={channelStyle}
        />
        <div className="flex min-w-0 flex-1 items-baseline gap-2">
          <Link
            to="/profile/$username"
            params={{ username: item.actor.username }}
            className="truncate font-mono text-xs font-bold text-foreground hover:text-primary"
            viewTransition
          >
            {actorName}
          </Link>
          <span className="truncate font-mono text-[10px] text-muted-foreground/80">
            @{item.actor.username}
          </span>
          <span className="ml-auto shrink-0 font-mono text-[10px] text-muted-foreground">
            {getRelativeTime(item.createdAt)}
          </span>
        </div>
      </div>

      <div className="mt-3 ml-10 flex flex-wrap items-center gap-3">
        <div className="flex min-w-0 items-center gap-2 border px-2.5 py-1" style={channelStyle}>
          <span className="font-mono text-[9px] uppercase tracking-[0.14em]">{channelLabel}</span>
          <CornerDownRight className="h-3 w-3" />
          {renderAttachedTitle(item)}
        </div>

        {ratingOutOfFive !== null ? (
          <div className="flex items-center gap-0.5" style={{ color: channelColor }}>
            {Array.from({ length: 5 }).map((_, index) => (
              <Star
                key={`feed-star-${item.id}-${index}`}
                className={cn(
                  "h-3.5 w-3.5",
                  index < filledStars ? "fill-current" : "text-white/15",
                )}
              />
            ))}
          </div>
        ) : null}
      </div>

      <p className="mt-3 ml-10 whitespace-pre-wrap font-mono text-sm leading-relaxed text-foreground/80">
        {item.metadata.excerpt ?? getActivityCopy(item)}
      </p>

      <div className="mt-3 ml-10 flex items-center gap-5">
        <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
          <Heart className="h-3.5 w-3.5" />
          {item.engagement.likeCount}
        </span>
        <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
          <MessageSquare className="h-3.5 w-3.5" />
          {item.engagement.commentCount}
        </span>
      </div>
    </article>
  );
};
