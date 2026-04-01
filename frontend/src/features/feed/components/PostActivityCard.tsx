import { Link } from "@tanstack/react-router";
import { Heart, MessageSquare, PenSquare } from "lucide-react";
import { getPosterUrl } from "@/features/films/components/utils";
import type { FeedItem } from "@/features/feed/types";
import { cn } from "@/lib/utils";

type PostActivityCardProps = {
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

export const PostActivityCard = ({ item }: PostActivityCardProps) => {
  const actorName = item.actor.displayUsername ?? item.actor.username;
  const actorAvatar = item.actor.avatarUrl ?? item.actor.image ?? null;
  const actorInitial = item.actor.username.slice(0, 1).toUpperCase();
  const postContent = item.post?.content ?? item.metadata.excerpt;
  const hasEngagement =
    item.engagement.likeCount > 0 || item.engagement.commentCount > 0;

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
              <PenSquare className="h-3.5 w-3.5 text-primary" />
            </p>
            <p className="text-xs text-muted-foreground">
              @{item.actor.username} · {getRelativeTime(item.createdAt)}
            </p>
          </div>
        </div>

      </header>

      {postContent ? (
        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground/95">
          {postContent}
        </p>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">Shared a post.</p>
      )}

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
