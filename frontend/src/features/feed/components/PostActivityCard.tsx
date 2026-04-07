import { useMemo, useState, type CSSProperties, type MouseEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { CornerDownRight, Heart, Loader2, MessageSquare, PenSquare } from "lucide-react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { FeedActorAvatar } from "@/features/feed/components/FeedActorAvatar";
import { PostActivityDialog } from "@/features/feed/components/PostActivityDialog";
import {
  feedChannelMeta,
  getRelativeTime,
  inferFeedChannel,
} from "@/features/feed/components/feed-row.utils";
import type { FeedItem } from "@/features/feed/types";
import { useLikePost, useUnlikePost } from "@/features/posts/hooks/usePosts";
import { cn } from "@/lib/utils";

type PostActivityCardProps = {
  item: FeedItem;
};

const getMediaLabel = (item: FeedItem): { title: string; year: string | null } => {
  if (item.movie) {
    return {
      title: item.movie.title,
      year: item.movie.releaseYear ? String(item.movie.releaseYear) : null,
    };
  }

  return {
    title: `@${item.actor.username}`,
    year: null,
  };
};

export const PostActivityCard = ({ item }: PostActivityCardProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const actorName = item.actor.displayUsername ?? item.actor.username;
  const actorAvatar = item.actor.avatarUrl ?? item.actor.image ?? null;
  const actorInitial = item.actor.username.slice(0, 1).toUpperCase();
  const postContent = item.post?.content ?? item.metadata.excerpt ?? "Shared a post.";
  const channel = inferFeedChannel(item);
  const mediaLabel = getMediaLabel(item);
  const postId = item.post?.id ?? item.metadata.postId ?? null;
  const isOwnPost = Boolean(user && user.id === item.actor.id);

  const likePostMutation = useLikePost(postId ?? "");
  const unlikePostMutation = useUnlikePost(postId ?? "");
  const isLikePending = likePostMutation.isPending || unlikePostMutation.isPending;

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"view" | "edit">("view");

  const channelVisual = useMemo(() => {
    if (channel) {
      return feedChannelMeta[channel];
    }

    return {
      label: "NETWORK",
      color: "var(--destructive)",
      tint: "color-mix(in srgb, var(--destructive) 12%, transparent)",
    };
  }, [channel]);

  const channelStyle = {
    borderColor: `color-mix(in srgb, ${channelVisual.color} 36%, transparent)`,
    background: channelVisual.tint,
    color: channelVisual.color,
  } satisfies CSSProperties;

  const to = item.movie
    ? item.movie.mediaType === "tv"
      ? "/serials/$tmdbId"
      : "/cinema/$tmdbId"
    : null;

  const openDialog = (mode: "view" | "edit") => {
    setDialogMode(mode);
    setIsDialogOpen(true);
  };

  const viewerHasLiked = item.engagement.viewerHasLiked === true;

  const handleToggleLike = async () => {
    if (!postId || isLikePending) {
      return;
    }

    if (!user) {
      const redirectPath = `${window.location.pathname}${window.location.search}`;
      await navigate({ to: "/login", search: { redirect: redirectPath } });
      return;
    }

    if (viewerHasLiked) {
      await unlikePostMutation.mutateAsync();
      return;
    }

    await likePostMutation.mutateAsync();
  };

  const handleRowClick = (event: MouseEvent<HTMLElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest("button, a, textarea, input")) {
      return;
    }

    openDialog("view");
  };

  return (
    <>
      <article
        className="group cursor-pointer border-b border-border/60 py-6"
        onClick={handleRowClick}
      >
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
            <span className="font-mono text-[9px] uppercase tracking-[0.14em]">
              {channelVisual.label}
            </span>
            <CornerDownRight className="h-3 w-3" />
            {to && item.movie ? (
              <Link
                to={to}
                params={{ tmdbId: String(item.movie.tmdbId) }}
                className="line-clamp-1 font-mono text-xs font-bold text-foreground hover:text-primary"
                viewTransition
              >
                {mediaLabel.title}
              </Link>
            ) : (
              <span className="font-mono text-xs font-bold text-foreground">{mediaLabel.title}</span>
            )}
            {mediaLabel.year ? (
              <span className="font-mono text-[10px] text-muted-foreground">{mediaLabel.year}</span>
            ) : null}
          </div>
        </div>

        <p className="mt-3 ml-10 w-full pr-3 whitespace-pre-wrap font-mono text-sm leading-relaxed text-foreground/80 transition-colors group-hover:text-foreground">
          {postContent}
        </p>

        <div className="mt-3 ml-10 flex items-center gap-5">
          <button
            type="button"
            onClick={() => {
              void handleToggleLike();
            }}
            disabled={isLikePending}
            className={cn(
              "inline-flex items-center gap-1.5 font-mono text-[11px] transition-colors",
              viewerHasLiked ? "text-primary" : "text-muted-foreground hover:text-foreground",
              isLikePending ? "cursor-not-allowed opacity-50" : "",
            )}
          >
            {isLikePending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Heart className={cn("h-3.5 w-3.5", viewerHasLiked ? "fill-current" : "")} />
            )}
            {item.engagement.likeCount}
          </button>

          <button
            type="button"
            onClick={() => {
              openDialog("view");
            }}
            className="inline-flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground transition-colors hover:text-foreground"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            {item.engagement.commentCount}
          </button>

          {isOwnPost ? (
            <button
              type="button"
              onClick={() => {
                openDialog("edit");
              }}
              className="inline-flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground transition-colors hover:text-foreground"
            >
              <PenSquare className="h-3.5 w-3.5" />
              EDIT
            </button>
          ) : null}
        </div>
      </article>

      {isDialogOpen ? (
        <PostActivityDialog
          item={item}
          isOpen={isDialogOpen}
          mode={dialogMode}
          onClose={() => {
            setIsDialogOpen(false);
            setDialogMode("view");
          }}
        />
      ) : null}
    </>
  );
};
