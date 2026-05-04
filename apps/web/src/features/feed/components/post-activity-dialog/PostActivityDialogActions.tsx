import { Heart, Loader2, MessageSquare, PenSquare } from "lucide-react";

type PostActivityDialogActionsProps = {
  likeCount: number;
  commentCount: number;
  isLikePending: boolean;
  viewerHasLiked: boolean;
  isOwnPost: boolean;
  isEditing: boolean;
  onToggleLike: () => void;
  onToggleEditing: () => void;
};

export const PostActivityDialogActions = ({
  likeCount,
  commentCount,
  isLikePending,
  viewerHasLiked,
  isOwnPost,
  isEditing,
  onToggleLike,
  onToggleEditing,
}: PostActivityDialogActionsProps) => {
  return (
    <div className="flex items-center gap-5 border-b border-border/60 pb-4">
      <button
        type="button"
        onClick={onToggleLike}
        className="inline-flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground transition-colors hover:text-foreground"
        disabled={isLikePending}
      >
        {isLikePending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Heart
            className={`h-3.5 w-3.5 ${viewerHasLiked ? "fill-current text-primary" : ""}`}
          />
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
          onClick={onToggleEditing}
          className="inline-flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground transition-colors hover:text-foreground"
        >
          <PenSquare className="h-3.5 w-3.5" />
          {isEditing ? "CANCEL" : "EDIT"}
        </button>
      ) : null}
    </div>
  );
};
