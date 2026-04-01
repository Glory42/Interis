import { Link } from "@tanstack/react-router";
import {
  BookOpen,
  Heart,
  MessageSquare,
  Repeat2,
  Sparkles,
  Star,
  UserPlus,
} from "lucide-react";
import { PostActivityCard } from "@/features/feed/components/PostActivityCard";
import { ReviewActivityCard } from "@/features/feed/components/ReviewActivityCard";
import { getPosterUrl } from "@/features/films/components/utils";
import type { FeedItem } from "@/features/feed/types";
import { cn } from "@/lib/utils";

type FeedActivityCardProps = {
  item: FeedItem;
};

const getRelativeTime = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const deltaSeconds = Math.round((date.getTime() - Date.now()) / 1000);
  const absSeconds = Math.abs(deltaSeconds);
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (absSeconds < 60) {
    return formatter.format(deltaSeconds, "second");
  }

  const deltaMinutes = Math.round(deltaSeconds / 60);
  if (Math.abs(deltaMinutes) < 60) {
    return formatter.format(deltaMinutes, "minute");
  }

  const deltaHours = Math.round(deltaMinutes / 60);
  if (Math.abs(deltaHours) < 24) {
    return formatter.format(deltaHours, "hour");
  }

  const deltaDays = Math.round(deltaHours / 24);
  return formatter.format(deltaDays, "day");
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
      return "liked a film";
    case "watchlisted_movie":
      return "updated watchlist";
    case "followed_user":
      return item.metadata.targetUsername
        ? `followed @${item.metadata.targetUsername}`
        : "followed someone";
    default:
      return "updated activity";
  }
};

const ActivityIcon = ({ kind }: { kind: FeedItem["kind"] }) => {
  switch (kind) {
    case "review":
      return <Star className="h-3.5 w-3.5 text-primary" />;
    case "diary_entry":
      return <Sparkles className="h-3.5 w-3.5 text-primary" />;
    case "liked_movie":
    case "liked_review":
    case "liked_comment":
    case "liked_post":
      return <Heart className="h-3.5 w-3.5 text-primary" />;
    case "commented":
    case "commented_post":
      return <MessageSquare className="h-3.5 w-3.5 text-primary" />;
    case "watchlisted_movie":
      return <Repeat2 className="h-3.5 w-3.5 text-primary" />;
    case "followed_user":
      return <UserPlus className="h-3.5 w-3.5 text-primary" />;
    case "created_list":
      return <BookOpen className="h-3.5 w-3.5 text-primary" />;
    default:
      return <Sparkles className="h-3.5 w-3.5 text-primary" />;
  }
};

export const FeedActivityCard = ({ item }: FeedActivityCardProps) => {
  if (item.kind === "post") {
    return <PostActivityCard item={item} />;
  }

  if (item.kind === "review" || (item.kind === "diary_entry" && item.review)) {
    return <ReviewActivityCard item={item} />;
  }

  const actorName = item.actor.displayUsername ?? item.actor.username;
  const actorAvatar = item.actor.avatarUrl ?? item.actor.image ?? null;
  const actorInitial = item.actor.username.slice(0, 1).toUpperCase();
  const reviewTargetUsername = item.metadata.targetUsername ?? null;
  const reviewTargetId = item.metadata.reviewId ?? null;
  const hasEngagement =
    item.engagement.likeCount > 0 || item.engagement.commentCount > 0;
  const hasReviewTargetLink =
    (item.kind === "liked_review" || item.kind === "commented") &&
    reviewTargetId !== null &&
    reviewTargetUsername !== null;

  return (
    <article className="rounded-2xl border border-border/70 bg-card/72 p-4 transition-colors hover:border-border">
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {actorAvatar ? (
            <img
              src={actorAvatar}
              alt={`${item.actor.username} avatar`}
              className="h-10 w-10 rounded-full border border-border/70 object-cover"
            />
          ) : (
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/70 bg-secondary text-xs font-semibold text-secondary-foreground">
              {actorInitial}
            </span>
          )}

          <div className="space-y-0.5">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <Link
                to="/profile/$username"
                params={{ username: item.actor.username }}
                className="hover:text-primary"
                viewTransition
              >
                {actorName}
              </Link>
              <ActivityIcon kind={item.kind} />
            </p>
            <p className="text-xs text-muted-foreground">
              @{item.actor.username} · {getRelativeTime(item.createdAt)}
            </p>
          </div>
        </div>

      </header>

      {hasReviewTargetLink ? (
        <p className="mt-3 text-sm text-muted-foreground">
          {item.kind === "liked_review" ? "liked" : "commented on"}{" "}
          <Link
            to="/reviews/$username/$reviewId"
            params={{
              username: reviewTargetUsername,
              reviewId: reviewTargetId,
            }}
            className="font-semibold text-foreground hover:text-primary"
            viewTransition
          >
            @{reviewTargetUsername}'s review
          </Link>
        </p>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">{getActivityCopy(item)}</p>
      )}

      {item.metadata.excerpt ? (
        <p className="mt-2 line-clamp-4 text-sm leading-relaxed text-foreground/95">
          "{item.metadata.excerpt}"
        </p>
      ) : null}

      {item.movie ? (
        item.movie.mediaType === "tv" ? (
          <Link
            to="/serials/$tmdbId"
            params={{ tmdbId: String(item.movie.tmdbId) }}
            className="mt-3 flex items-center gap-3 rounded-xl border border-border/70 bg-background/30 p-2.5 transition-colors hover:border-border hover:bg-secondary/45"
            viewTransition
          >
            <img
              src={getPosterUrl(item.movie.posterPath)}
              alt={`${item.movie.title} poster`}
              className="h-14 w-10 rounded object-cover"
              loading="lazy"
            />

            <div className="min-w-0 flex-1">
              <p className="line-clamp-1 text-sm font-semibold text-foreground">
                {item.movie.title}
              </p>
              <p className="text-xs text-muted-foreground">
                {item.movie.releaseYear ?? "Unknown year"}
              </p>
            </div>
          </Link>
        ) : (
          <Link
            to="/cinema/$tmdbId"
            params={{ tmdbId: String(item.movie.tmdbId) }}
            className="mt-3 flex items-center gap-3 rounded-xl border border-border/70 bg-background/30 p-2.5 transition-colors hover:border-border hover:bg-secondary/45"
            viewTransition
          >
            <img
              src={getPosterUrl(item.movie.posterPath)}
              alt={`${item.movie.title} poster`}
              className="h-14 w-10 rounded object-cover"
              loading="lazy"
            />

            <div className="min-w-0 flex-1">
              <p className="line-clamp-1 text-sm font-semibold text-foreground">
                {item.movie.title}
              </p>
              <p className="text-xs text-muted-foreground">
                {item.movie.releaseYear ?? "Unknown year"}
              </p>
            </div>
          </Link>
        )
      ) : null}

      {hasEngagement ? (
        <footer className="mt-3 flex items-center gap-4 border-t border-border/60 pt-3 text-xs text-muted-foreground">
          <span
            className={cn(
              "inline-flex items-center gap-1",
              item.engagement.likeCount > 0 ? "text-foreground" : "",
            )}
          >
            <Heart className="h-3.5 w-3.5" />
            {item.engagement.likeCount}
          </span>
          <span
            className={cn(
              "inline-flex items-center gap-1",
              item.engagement.commentCount > 0 ? "text-foreground" : "",
            )}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            {item.engagement.commentCount}
          </span>
        </footer>
      ) : null}
    </article>
  );
};
