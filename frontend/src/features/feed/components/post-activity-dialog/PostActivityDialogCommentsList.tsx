import type { PostComment } from "@/features/posts/api";

type PostActivityDialogCommentsListProps = {
  comments: PostComment[];
  isPending: boolean;
  isError: boolean;
};

export const PostActivityDialogCommentsList = ({
  comments,
  isPending,
  isError,
}: PostActivityDialogCommentsListProps) => {
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

      {comments.map((comment) => (
        <div
          key={comment.id}
          className="border border-border/70 bg-background/35 px-3 py-2"
        >
          <p className="font-mono text-[10px] text-muted-foreground">
            @{comment.authorUsername ?? "unknown"}
          </p>
          <p className="mt-1 whitespace-pre-wrap font-mono text-xs text-foreground/85">
            {comment.content}
          </p>
        </div>
      ))}
    </div>
  );
};
