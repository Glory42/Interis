import { Loader2, PenSquare, Trash2, X } from "lucide-react";
import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { getRelativeTime } from "@/features/feed/components/feed-row.utils";
import type { PostComment } from "@/features/posts/api";
import { useDeletePostComment, useUpdatePostComment } from "@/features/posts/hooks/usePosts";

type PostActivityDialogCommentsListProps = {
  postId: string;
  comments: PostComment[];
  isPending: boolean;
  isError: boolean;
};

export const PostActivityDialogCommentsList = ({
  postId,
  comments,
  isPending,
  isError,
}: PostActivityDialogCommentsListProps) => {
  const { user } = useAuth();
  const updateCommentMutation = useUpdatePostComment(postId);
  const deleteCommentMutation = useDeletePostComment(postId);

  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const startEditing = (comment: PostComment) => {
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
    <div className="space-y-3">
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        Comments
      </p>

      {isPending ? (
        <p className="font-mono text-[11px] text-muted-foreground">loading comments...</p>
      ) : null}

      {isError ? (
        <p className="font-mono text-[11px] text-destructive">could not load comments.</p>
      ) : null}

      {!isPending && !isError && comments.length === 0 ? (
        <p className="font-mono text-[11px] text-muted-foreground">no comments yet.</p>
      ) : null}

      {comments.map((comment) => {
        const isOwnComment = Boolean(user && user.id === comment.userId);
        const isEditing = editingCommentId === comment.id;

        return (
          <div key={comment.id} className="rounded-lg border border-border/70 bg-background/35 px-3 py-2">
            <div className="flex items-center gap-2">
              <p className="min-w-0 flex-1 font-mono text-[10px] text-muted-foreground">
                @{comment.authorUsername ?? "unknown"} · {getRelativeTime(comment.createdAt)}
              </p>

              {isOwnComment && !isEditing ? (
                <div className="flex shrink-0 items-center gap-2.5">
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
              <div className="mt-1.5 space-y-2">
                <textarea
                  value={editDraft}
                  onChange={(event) => setEditDraft(event.target.value.slice(0, 1000))}
                  autoFocus
                  className="min-h-16 w-full resize-y border border-border/70 bg-background/45 px-2 py-1.5 font-mono text-xs text-foreground"
                />
                <div className="flex items-center justify-end gap-2 font-mono text-[10px] uppercase tracking-[0.1em]">
                  <button
                    type="button"
                    onClick={cancelEditing}
                    className="inline-flex items-center gap-1 border border-border/70 px-2 py-1 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                    cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      void saveEditing(comment.id);
                    }}
                    disabled={updateCommentMutation.isPending || editDraft.trim().length === 0}
                    className="inline-flex items-center gap-1 border border-primary/45 bg-primary/10 px-2 py-1 text-primary disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {updateCommentMutation.isPending ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : null}
                    save
                  </button>
                </div>
              </div>
            ) : (
              <p className="mt-1 whitespace-pre-wrap font-mono text-xs text-foreground/85">
                {comment.content}
              </p>
            )}
          </div>
        );
      })}

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
    </div>
  );
};
