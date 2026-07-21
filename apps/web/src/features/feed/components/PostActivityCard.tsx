import { memo, useState, type MouseEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Flag, Heart, Loader2, MessageSquare, PenSquare } from "lucide-react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { FeedActorAvatar } from "@/features/feed/components/FeedActorAvatar";
import { FeedCardHeader } from "@/features/feed/components/FeedCardHeader";
import { FeedMoviePreviewCard } from "@/features/feed/components/FeedMoviePreviewCard";
import { PostActivityDialog } from "@/features/feed/components/PostActivityDialog";
import {
  feedChannelMeta,
  inferFeedChannel,
  truncateQuote,
} from "@/features/feed/components/feed-row.utils";
import type { FeedItem } from "@/features/feed/types";
import { useLikePost, useUnlikePost } from "@/features/posts/hooks/usePosts";
import { ReportContentDialog } from "@/features/reports/components/ReportContentDialog";
import { cn } from "@/lib/utils";

type PostActivityCardProps = {
  item: FeedItem;
};

export const PostActivityCard = memo(function PostActivityCard({ item }: PostActivityCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const actorName = item.actor.displayUsername ?? item.actor.username;
  const actorAvatar = item.actor.avatarUrl ?? null;
  const actorInitial = item.actor.username.slice(0, 1).toUpperCase();
  const channel = inferFeedChannel(item);
  const channelColor = channel ? feedChannelMeta[channel].color : "var(--module-neutral)";
  const postId = item.post?.id ?? item.metadata.postId ?? null;

  // "post" is the actor's own new post — no verb needed, no quoted
  // original. "commented_post"/"liked_post" are activity *about* someone's
  // post, so they get an explicit verb and a quoted snippet of the
  // original post instead of silently re-showing it as if it were new.
  const isCommentOnPost = item.kind === "commented_post";
  const isLikeOnPost = item.kind === "liked_post";
  const verb = isCommentOnPost ? "Commented on a post" : isLikeOnPost ? "Liked a post" : null;
  const primaryText = isCommentOnPost
    ? item.metadata.excerpt || "Left a comment on a post."
    : isLikeOnPost
      ? null
      : (item.post?.content ?? item.metadata.excerpt ?? "Shared a post.");
  const quotedOriginal = verb ? (item.post?.content ?? null) : null;
  const isOwnPost = item.kind === "post" && Boolean(user && user.id === item.actor.id);

  const likePostMutation = useLikePost(postId ?? "");
  const unlikePostMutation = useUnlikePost(postId ?? "");
  const isLikePending = likePostMutation.isPending || unlikePostMutation.isPending;

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"view" | "edit">("view");
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);

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

  const handleReport = async () => {
    if (!user) {
      const redirectPath = `${window.location.pathname}${window.location.search}`;
      await navigate({ to: "/login", search: { redirect: redirectPath } });
      return;
    }

    setIsReportDialogOpen(true);
  };

  return (
    <>
      <article
        className="group -mx-2 flex cursor-pointer gap-3 border border-transparent border-b-border/40 px-3 py-3.5 transition-colors hover:border-border/60 hover:bg-foreground/[0.025]"
        onClick={handleRowClick}
      >
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

          {verb ? (
            <p className="mt-0.5 text-[15px] leading-snug text-foreground/90">{verb}</p>
          ) : null}

          {primaryText ? (
            <p className="mt-0.5 w-full whitespace-pre-wrap text-[15px] leading-snug text-foreground/90 transition-colors group-hover:text-foreground">
              {primaryText}
            </p>
          ) : null}

          {quotedOriginal ? (
            <div className="mt-2 border-l-2 border-border/50 pl-3">
              <p className="text-xs leading-relaxed text-muted-foreground">
                "{truncateQuote(quotedOriginal, 140)}"
              </p>
            </div>
          ) : null}

          {to && item.movie ? (
            <FeedMoviePreviewCard
              to={to}
              tmdbId={item.movie.tmdbId}
              title={item.movie.title}
              releaseYear={item.movie.releaseYear}
              posterPath={item.movie.posterPath}
              accentColor={channelColor}
            />
          ) : null}

          <div className="mt-2.5 flex items-center gap-6 text-xs text-muted-foreground">
            <button
              type="button"
              onClick={() => {
                void handleToggleLike();
              }}
              disabled={isLikePending}
              className={cn(
                "inline-flex items-center gap-1.5 transition-colors",
                viewerHasLiked ? "text-primary" : "hover:text-primary",
                isLikePending ? "cursor-not-allowed opacity-50" : "",
              )}
            >
              {isLikePending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Heart className={cn("h-4 w-4", viewerHasLiked ? "fill-current" : "")} />
              )}
              {item.engagement.likeCount}
            </button>

            <button
              type="button"
              onClick={() => {
                openDialog("view");
              }}
              className="inline-flex items-center gap-1.5 transition-colors hover:text-primary"
            >
              <MessageSquare className="h-4 w-4" />
              {item.engagement.commentCount}
            </button>

            {isOwnPost ? (
              <button
                type="button"
                onClick={() => {
                  openDialog("edit");
                }}
                className="inline-flex items-center gap-1.5 transition-colors hover:text-primary"
              >
                <PenSquare className="h-4 w-4" />
                Edit
              </button>
            ) : null}

            {!isOwnPost && postId ? (
              <button
                type="button"
                onClick={() => {
                  void handleReport();
                }}
                className="ml-auto inline-flex items-center gap-1.5 transition-colors hover:text-destructive"
              >
                <Flag className="h-4 w-4" />
                Report
              </button>
            ) : null}
          </div>
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

      {postId ? (
        <ReportContentDialog
          isOpen={isReportDialogOpen}
          onClose={() => setIsReportDialogOpen(false)}
          targetType="post"
          targetId={postId}
        />
      ) : null}
    </>
  );
});
