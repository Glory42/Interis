import { memo, type CSSProperties } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { CornerDownRight, Heart, MessageSquare } from "lucide-react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { FeedActorAvatar } from "@/features/feed/components/FeedActorAvatar";
import { PostActivityCard } from "@/features/feed/components/PostActivityCard";
import { ReviewActivityCard } from "@/features/feed/components/ReviewActivityCard";
import {
  feedChannelMeta,
  getRelativeTime,
  inferFeedChannel,
  toSeasonEpisodeLabel,
} from "@/features/feed/components/feed-row.utils";
import { useLikeActivity, useUnlikeActivity } from "@/features/feed/hooks/useFeed";
import { SpaceRatingDisplay } from "@/features/films/components/SpaceRating";
import type { FeedItem } from "@/features/feed/types";
import { cn } from "@/lib/utils";

type FeedActivityCardProps = {
  item: FeedItem;
};

const getActivityCopy = (item: FeedItem): string => {
  const seLabel = toSeasonEpisodeLabel(item);
  switch (item.kind) {
    case "diary_entry":
      return "logged a watch entry";
    case "review":
      return seLabel ? `reviewed ${seLabel}` : "published a review";
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
      if (seLabel && item.metadata.rating !== null) return `rated ${seLabel}`;
      return seLabel ? `liked ${seLabel}` : "liked a title";
    case "watchlisted_movie":
      return "updated watchlist";
    case "followed_user":
      return item.metadata.targetUsername
        ? `followed @${item.metadata.targetUsername}`
        : "followed someone";
    case "created_list":
      return item.metadata.listTitle ? `created list "${item.metadata.listTitle}"` : "created a list";
    default:
      return "updated activity";
  }
};

const renderAttachedTitle = (item: FeedItem) => {
  if (item.kind === "created_list" && item.metadata.listId) {
    return (
      <Link
        to="/profile/$username/lists/$listId"
        params={{ username: item.actor.username, listId: item.metadata.listId }}
        className="line-clamp-1 font-mono text-xs font-bold text-foreground hover:text-primary"
        viewTransition
      >
        {item.metadata.listTitle ?? "a list"}
      </Link>
    );
  }

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

const ActivityEngagement = ({ item }: { item: FeedItem }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const likeMutation = useLikeActivity(item.id);
  const unlikeMutation = useUnlikeActivity(item.id);

  const viewerHasLiked = item.engagement.viewerHasLiked === true;
  const isLikePending = likeMutation.isPending || unlikeMutation.isPending;

  const handleToggleLike = async () => {
    if (isLikePending) return;

    if (!user) {
      const redirectPath = `${window.location.pathname}${window.location.search}`;
      await navigate({ to: "/login", search: { redirect: redirectPath } });
      return;
    }

    if (viewerHasLiked) {
      await unlikeMutation.mutateAsync();
    } else {
      await likeMutation.mutateAsync();
    }
  };

  return (
    <div className="mt-3 ml-10 flex items-center gap-5">
      <button
        type="button"
        disabled={isLikePending}
        onClick={() => void handleToggleLike()}
        className={cn(
          "inline-flex items-center gap-1.5 font-mono text-[11px] transition-colors disabled:cursor-not-allowed",
          viewerHasLiked
            ? "text-primary"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Heart className={cn("h-3.5 w-3.5", viewerHasLiked && "fill-current")} />
        {item.engagement.likeCount}
      </button>
      <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
        <MessageSquare className="h-3.5 w-3.5" />
        {item.engagement.commentCount}
      </span>
    </div>
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

  const channel = inferFeedChannel(item);
  const channelLabel = channel ? feedChannelMeta[channel].label : "FEED";
  const channelColor = channel ? feedChannelMeta[channel].color : "var(--module-neutral)";
  const channelTint = channel ? feedChannelMeta[channel].tint : "rgba(156, 163, 175, 0.08)";
  const actorName = item.actor.displayUsername ?? item.actor.username;
  const actorInitial = item.actor.username.slice(0, 1).toUpperCase();
  const actorAvatar = item.actor.avatarUrl ?? null;

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

        {item.metadata.rating !== null ? (
          <SpaceRatingDisplay rating={item.metadata.rating} size="sm" />
        ) : null}
      </div>

      <p className="mt-3 ml-10 whitespace-pre-wrap font-mono text-sm leading-relaxed text-foreground/80">
        {item.metadata.excerpt ?? getActivityCopy(item)}
      </p>

      <ActivityEngagement item={item} />
    </article>
  );
});
