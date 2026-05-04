import { Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

type PostActivityDialogCommentComposerProps = {
  commentDraft: string;
  canSubmitComment: boolean;
  isSubmittingComment: boolean;
  submitError: unknown;
  onCommentDraftChange: (nextValue: string) => void;
  onSubmitComment: () => void;
};

export const PostActivityDialogCommentComposer = ({
  commentDraft,
  canSubmitComment,
  isSubmittingComment,
  submitError,
  onCommentDraftChange,
  onSubmitComment,
}: PostActivityDialogCommentComposerProps) => {
  return (
    <div className="space-y-2 border-t border-border/60 pt-4">
      <Textarea
        value={commentDraft}
        onChange={(event) => {
          if (event.target.value.length <= 1000) {
            onCommentDraftChange(event.target.value);
          }
        }}
        placeholder="write a comment..."
        className="min-h-18 border-border/75 bg-background/45 font-mono text-sm"
      />
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[10px] text-muted-foreground">
          {commentDraft.length}/1000
        </span>
        <button
          type="button"
          onClick={onSubmitComment}
          disabled={!canSubmitComment}
          className="border border-primary/45 bg-primary/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmittingComment ? (
            <span className="inline-flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" /> posting
            </span>
          ) : (
            "comment"
          )}
        </button>
      </div>

      {submitError ? (
        <p className="font-mono text-[11px] text-destructive">
          {submitError instanceof Error ? submitError.message : "could not post comment."}
        </p>
      ) : null}
    </div>
  );
};
