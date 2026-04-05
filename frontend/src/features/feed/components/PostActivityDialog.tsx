import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "@tanstack/react-router";
import { Heart, Loader2, MessageSquare, PenSquare, X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { FeedActorAvatar } from "@/features/feed/components/FeedActorAvatar";
import { getRelativeTime } from "@/features/feed/components/feed-row.utils";
import type { FeedItem } from "@/features/feed/types";
import {
  useAddPostComment,
  useLikePost,
  usePostComments,
  usePostDetail,
  useUnlikePost,
  useUpdatePost,
} from "@/features/posts/hooks/usePosts";

type PostActivityDialogProps = {
  item: FeedItem;
  isOpen: boolean;
  mode: "view" | "edit";
  onClose: () => void;
};

export const PostActivityDialog = ({
  item,
  isOpen,
  mode,
  onClose,
}: PostActivityDialogProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const postId = item.post?.id ?? item.metadata.postId ?? null;
  const isOwnPost = Boolean(user && user.id === item.actor.id);

  const postDetailQuery = usePostDetail(postId ?? "", Boolean(isOpen && postId));
  const postCommentsQuery = usePostComments(postId ?? "", Boolean(isOpen && postId));

  const addCommentMutation = useAddPostComment(postId ?? "");
  const likePostMutation = useLikePost(postId ?? "");
  const unlikePostMutation = useUnlikePost(postId ?? "");
  const updatePostMutation = useUpdatePost(postId ?? "");

  const [commentDraft, setCommentDraft] = useState("");
  const [editDraft, setEditDraft] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const content =
    postDetailQuery.data?.content ?? item.post?.content ?? item.metadata.excerpt ?? "";

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setEditDraft(content);
    setIsEditing(mode === "edit" && isOwnPost);
  }, [content, isOpen, isOwnPost, mode]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, onClose]);

  const actorAvatar = item.actor.avatarUrl ?? item.actor.image ?? null;
  const actorInitial = item.actor.username.slice(0, 1).toUpperCase();
  const actorName = item.actor.displayUsername ?? item.actor.username;
  const likeCount = postDetailQuery.data?.likeCount ?? item.engagement.likeCount;
  const commentCount = postCommentsQuery.data?.length ?? item.engagement.commentCount;
  const viewerHasLiked = item.engagement.viewerHasLiked === true;
  const isLikePending = likePostMutation.isPending || unlikePostMutation.isPending;

  const canSaveEdit =
    isOwnPost &&
    editDraft.trim().length > 0 &&
    editDraft.trim().length <= 250 &&
    !updatePostMutation.isPending;

  const comments = postCommentsQuery.data ?? [];
  const canSubmitComment =
    commentDraft.trim().length > 0 &&
    commentDraft.trim().length <= 1000 &&
    !addCommentMutation.isPending;

  const dialogTitle = useMemo(() => {
    if (item.movie?.title) {
      return item.movie.title;
    }

    return "Network post";
  }, [item.movie?.title]);

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

  const handleSubmitComment = async () => {
    if (!postId || !canSubmitComment) {
      return;
    }

    if (!user) {
      const redirectPath = `${window.location.pathname}${window.location.search}`;
      await navigate({ to: "/login", search: { redirect: redirectPath } });
      return;
    }

    await addCommentMutation.mutateAsync({ content: commentDraft.trim() });
    setCommentDraft("");
  };

  const handleSaveEdit = async () => {
    if (!postId || !canSaveEdit) {
      return;
    }

    await updatePostMutation.mutateAsync({ content: editDraft.trim() });
    setIsEditing(false);
  };

  if (!isOpen || !postId) {
    return null;
  }

  return createPortal(
    <div className="theme-modal-overlay fixed inset-0 z-[140] flex items-center justify-center px-4 py-6 bg-background/70 backdrop-blur-sm sm:py-10">
      <button
        type="button"
        aria-label="Close post dialog"
        className="absolute inset-0"
        onClick={onClose}
      />

      <section className="theme-modal-panel relative z-10 flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden border border-border/80 bg-card/95 p-0 animate-fade-up">
          <div className="flex items-start justify-between border-b border-border/70 px-4 py-3">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                POST THREAD
              </p>
              <p className="font-mono text-xs text-foreground">{dialogTitle}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-7 w-7 items-center justify-center border border-border/70 text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-4 overflow-y-auto px-4 py-4">
            <div className="flex items-center gap-3">
              <FeedActorAvatar
                avatarUrl={actorAvatar}
                username={item.actor.username}
                initial={actorInitial}
                className="flex h-8 w-8 items-center justify-center overflow-hidden border border-border/70"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-mono text-xs font-bold text-foreground">{actorName}</p>
                <p className="font-mono text-[10px] text-muted-foreground">
                  @{item.actor.username} · {getRelativeTime(item.createdAt)}
                </p>
              </div>
            </div>

            {isEditing ? (
              <div className="space-y-2">
                <Textarea
                  value={editDraft}
                  onChange={(event) => {
                    if (event.target.value.length <= 250) {
                      setEditDraft(event.target.value);
                    }
                  }}
                  className="min-h-[5.5rem] border-border/75 bg-background/45 font-mono text-sm"
                />
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {editDraft.length}/250
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditDraft(content);
                        setIsEditing(false);
                      }}
                      className="border border-border/70 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground"
                    >
                      cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        void handleSaveEdit();
                      }}
                      disabled={!canSaveEdit}
                      className="border border-primary/45 bg-primary/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-primary disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {updatePostMutation.isPending ? (
                        <span className="inline-flex items-center gap-1">
                          <Loader2 className="h-3 w-3 animate-spin" /> saving
                        </span>
                      ) : (
                        "save"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (isOwnPost) {
                    setIsEditing(true);
                  }
                }}
                className="w-full text-left whitespace-pre-wrap font-mono text-sm leading-relaxed text-foreground/85"
              >
                {content}
              </button>
            )}

            <div className="flex items-center gap-5 border-b border-border/60 pb-4">
              <button
                type="button"
                onClick={() => {
                  void handleToggleLike();
                }}
                className="inline-flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground transition-colors hover:text-foreground"
                disabled={isLikePending}
              >
                {isLikePending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Heart className={`h-3.5 w-3.5 ${viewerHasLiked ? "fill-current text-primary" : ""}`} />
                )}
                {likeCount}
              </button>

              <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
                <MessageSquare className="h-3.5 w-3.5" />
                {commentCount}
              </span>

              {isOwnPost ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing((current) => !current);
                  }}
                  className="inline-flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground transition-colors hover:text-foreground"
                >
                  <PenSquare className="h-3.5 w-3.5" />
                  {isEditing ? "CANCEL" : "EDIT"}
                </button>
              ) : null}
            </div>

            <div className="space-y-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                Comments
              </p>

              {postCommentsQuery.isPending ? (
                <p className="font-mono text-[11px] text-muted-foreground">loading comments...</p>
              ) : null}

              {postCommentsQuery.isError ? (
                <p className="font-mono text-[11px] text-destructive">could not load comments.</p>
              ) : null}

              {!postCommentsQuery.isPending && !postCommentsQuery.isError && comments.length === 0 ? (
                <p className="font-mono text-[11px] text-muted-foreground">no comments yet.</p>
              ) : null}

              {comments.map((comment) => (
                <div key={comment.id} className="border border-border/70 bg-background/35 px-3 py-2">
                  <p className="font-mono text-[10px] text-muted-foreground">
                    @{comment.authorUsername ?? "unknown"}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap font-mono text-xs text-foreground/85">
                    {comment.content}
                  </p>
                </div>
              ))}
            </div>

            <div className="space-y-2 border-t border-border/60 pt-4">
              <Textarea
                value={commentDraft}
                onChange={(event) => {
                  if (event.target.value.length <= 1000) {
                    setCommentDraft(event.target.value);
                  }
                }}
                placeholder="write a comment..."
                className="min-h-[4.5rem] border-border/75 bg-background/45 font-mono text-sm"
              />
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[10px] text-muted-foreground">
                  {commentDraft.length}/1000
                </span>
                <button
                  type="button"
                  onClick={() => {
                    void handleSubmitComment();
                  }}
                  disabled={!canSubmitComment}
                  className="border border-primary/45 bg-primary/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-primary disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {addCommentMutation.isPending ? (
                    <span className="inline-flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" /> posting
                    </span>
                  ) : (
                    "comment"
                  )}
                </button>
              </div>

              {addCommentMutation.isError ? (
                <p className="font-mono text-[11px] text-destructive">
                  {addCommentMutation.error instanceof Error
                    ? addCommentMutation.error.message
                    : "could not post comment."}
                </p>
              ) : null}
            </div>
          </div>
      </section>
    </div>,
    document.body,
  );
};
