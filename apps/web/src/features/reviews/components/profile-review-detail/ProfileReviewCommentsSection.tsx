import { Loader2, PenSquare, Trash2, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Textarea } from "@/components/ui/textarea";
import type { ReviewComment, ReviewDetail } from "@/features/reviews/api";
import { useDeleteReviewComment, useUpdateReviewComment } from "@/features/reviews/hooks/useReviews";
import { formatRelativeTime } from "@/features/reviews/components/profile-review-detail/utils";

type ProfileReviewCommentsSectionProps = {
  detail: ReviewDetail;
  comments: ReviewComment[];
  commentsPending: boolean;
  commentsError: boolean;
  commentDraft: string;
  onCommentDraftChange: (nextValue: string) => void;
  addCommentPending: boolean;
  addCommentError: boolean;
  onSubmitComment: () => void;
};

export const ProfileReviewCommentsSection = ({
  detail,
  comments,
  commentsPending,
  commentsError,
  commentDraft,
  onCommentDraftChange,
  addCommentPending,
  addCommentError,
  onSubmitComment,
}: ProfileReviewCommentsSectionProps) => {
  const { user } = useAuth();
  const updateCommentMutation = useUpdateReviewComment(detail.id, detail.mediaType);
  const deleteCommentMutation = useDeleteReviewComment(detail.id, detail.mediaType);

  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const startEditing = (comment: ReviewComment) => {
    setEditingCommentId(comment.id);
    setEditDraft(comment.content);
  };

  const cancelEditing = () => {
    setEditingCommentId(null);
    setEditDraft("");
  };

  const saveEditing = async (commentId: string) => {
    const trimmedContent = editDraft.trim();
    if (trimmedContent.length === 0 || updateCommentMutation.isPending) {
      return;
    }

    await updateCommentMutation.mutateAsync({ commentId, content: trimmedContent });
    setEditingCommentId(null);
    setEditDraft("");
  };

  const confirmDelete = async () => {
    if (!pendingDeleteId || deleteCommentMutation.isPending) {
      return;
    }

    await deleteCommentMutation.mutateAsync(pendingDeleteId);
    setPendingDeleteId(null);
  };

  return (
    <section id="review-comments" className="rounded-2xl border border-border/60 bg-card/35 p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-foreground">Comments</h2>
        <span className="text-xs text-muted-foreground">
          {detail.engagement.commentCount} total
        </span>
      </div>

      <div className="space-y-3">
        {commentsPending ? (
          <p className="text-xs text-muted-foreground">Loading comments...</p>
        ) : null}

        {commentsError ? <p className="text-xs text-destructive">Could not load comments.</p> : null}

        {!commentsPending && !commentsError && comments.length === 0 ? (
          <p className="text-xs text-muted-foreground">No comments yet.</p>
        ) : null}

        {!commentsPending && !commentsError
          ? comments.map((comment) => {
              const commentAuthor =
                comment.authorDisplayUsername ?? comment.authorUsername;
              const commentAvatar = comment.authorAvatarUrl;
              const isOwnComment = Boolean(user && user.id === comment.userId);
              const isEditing = editingCommentId === comment.id;

              return (
                <article key={comment.id} className="rounded-lg border border-border/60 bg-card/50 p-3">
                  <div className="mb-1.5 flex items-center gap-2">
                    {commentAvatar ? (
                      <img
                        src={commentAvatar}
                        alt={`${comment.authorUsername} avatar`}
                        className="h-7 w-7 border border-border/60 object-cover"
                      />
                    ) : (
                      <span className="inline-flex h-7 w-7 items-center justify-center border border-border/60 bg-secondary text-[10px] font-semibold text-secondary-foreground">
                        {comment.authorUsername.slice(0, 1).toUpperCase()}
                      </span>
                    )}

                    <p className="min-w-0 flex-1 text-[11px] text-muted-foreground">
                      <span className="font-semibold text-foreground">{commentAuthor}</span>
                      <span> · {formatRelativeTime(comment.createdAt)}</span>
                    </p>

                    {isOwnComment && !isEditing ? (
                      <div className="flex shrink-0 items-center gap-3">
                        <button
                          type="button"
                          onClick={() => startEditing(comment)}
                          aria-label="Edit comment"
                          className="text-muted-foreground transition-colors hover:text-primary"
                        >
                          <PenSquare className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setPendingDeleteId(comment.id)}
                          disabled={deleteCommentMutation.isPending}
                          aria-label="Delete comment"
                          className="text-muted-foreground transition-colors hover:text-destructive disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : null}
                  </div>

                  {isEditing ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editDraft}
                        onChange={(event) => setEditDraft(event.target.value.slice(0, 2000))}
                        className="min-h-20 border-border/70 bg-background/40 text-sm"
                        autoFocus
                      />
                      <div className="flex items-center justify-end gap-2">
                        <Button type="button" size="sm" variant="ghost" onClick={cancelEditing}>
                          <X className="h-3.5 w-3.5" />
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          disabled={updateCommentMutation.isPending || editDraft.trim().length === 0}
                          onClick={() => {
                            void saveEditing(comment.id);
                          }}
                        >
                          {updateCommentMutation.isPending ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : null}
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap text-sm text-foreground/95">{comment.content}</p>
                  )}
                </article>
              );
            })
          : null}
      </div>

      <div className="mt-5 space-y-2 border-t border-border/60 pt-5">
        <Textarea
          value={commentDraft}
          onChange={(event) => onCommentDraftChange(event.target.value.slice(0, 2000))}
          placeholder="Write a comment..."
          className="min-h-24 border-border/70 bg-background/40 text-sm"
        />

        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] text-muted-foreground">{commentDraft.length}/2000</p>
          <Button
            type="button"
            size="sm"
            disabled={addCommentPending || commentDraft.trim().length === 0}
            onClick={() => {
              void onSubmitComment();
            }}
          >
            {addCommentPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            Add Comment
          </Button>
        </div>

        {addCommentError ? <p className="text-xs text-destructive">Could not post comment.</p> : null}
      </div>

      <ConfirmDialog
        isOpen={pendingDeleteId !== null}
        title="Delete this comment?"
        description="This cannot be undone."
        confirmLabel="Delete"
        isDestructive
        isConfirming={deleteCommentMutation.isPending}
        onConfirm={() => {
          void confirmDelete();
        }}
        onClose={() => setPendingDeleteId(null)}
      />
    </section>
  );
};
