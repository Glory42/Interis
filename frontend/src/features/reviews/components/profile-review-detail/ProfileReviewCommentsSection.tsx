import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { ReviewComment, ReviewDetail } from "@/features/reviews/api";
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
  return (
    <section id="review-comments" className="border border-border/60 bg-card/35 p-5 sm:p-6">
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
              const commentAvatar = comment.authorAvatarUrl ?? comment.authorImage;

              return (
                <article key={comment.id} className="border border-border/60 bg-card/50 p-3">
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

                    <p className="text-[11px] text-muted-foreground">
                      <span className="font-semibold text-foreground">{commentAuthor}</span>
                      <span> · {formatRelativeTime(comment.createdAt)}</span>
                    </p>
                  </div>

                  <p className="whitespace-pre-wrap text-sm text-foreground/95">{comment.content}</p>
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
    </section>
  );
};
