import { Link } from "@tanstack/react-router";
import { useState, type KeyboardEvent } from "react";
import { Loader2, SendHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FeedActorAvatar } from "@/features/feed/components/FeedActorAvatar";
import { Textarea } from "@/components/ui/textarea";
import { useCreatePost } from "@/features/posts/hooks/usePosts";
import type { MeProfile } from "@/types/api";

type QuickLogComposerProps = {
  user: MeProfile | null;
};

export const QuickLogComposer = ({ user }: QuickLogComposerProps) => {
  const createPostMutation = useCreatePost();
  const [content, setContent] = useState("");

  if (!user) {
    return (
      <div className="border border-border/70 bg-card/72 p-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          // LOG_CONSOLE_LOCKED
        </p>
        <p className="mt-2 font-mono text-xs text-muted-foreground">
          sign in to publish quick log entries.
        </p>
        <Button asChild size="sm" className="mt-3">
          <Link to="/login">SIGN IN</Link>
        </Button>
      </div>
    );
  }

  const profileInitial = user.username.slice(0, 1).toUpperCase();
  const avatarUrl = user.avatarUrl ?? user.image ?? null;
  const trimmedContent = content.trim();
  const canSubmit =
    trimmedContent.length > 0 &&
    trimmedContent.length <= 250 &&
    !createPostMutation.isPending;

  const handleSubmit = async () => {
    if (!canSubmit) {
      return;
    }

    await createPostMutation.mutateAsync({ content: trimmedContent });
    setContent("");
  };

  const handleTextareaKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter" || event.shiftKey) {
      return;
    }

    event.preventDefault();
    void handleSubmit();
  };

  return (
    <div className="border border-border/70 bg-card/72 p-4">
      <div className="flex items-start gap-3">
        <div className="flex shrink-0 flex-col items-center gap-2">
          <FeedActorAvatar
            avatarUrl={avatarUrl}
            username={user.username}
            initial={profileInitial}
            className="flex h-8 w-8 items-center justify-center overflow-hidden border border-primary/35 bg-primary/10 font-mono text-xs font-bold text-primary"
          />

          <Button
            type="button"
            size="sm"
            className="h-7 px-2.5 text-[10px]"
            disabled={!canSubmit}
            onClick={() => {
              void handleSubmit();
            }}
          >
            {createPostMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <SendHorizontal className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <Textarea
            value={content}
            onKeyDown={handleTextareaKeyDown}
            onChange={(event) => {
              if (event.target.value.length <= 250) {
                setContent(event.target.value);
              }
            }}
            placeholder="log a thought..."
            className="min-h-[4.5rem] resize-y border-border/70 bg-background/55 font-mono text-sm"
          />

          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-[10px] text-muted-foreground">
              Enter submits. Shift+Enter newline. {content.length}/250
            </span>
          </div>
        </div>
      </div>

      {createPostMutation.isError ? (
        <p className="mt-2 font-mono text-[11px] text-destructive">
          {createPostMutation.error instanceof Error
            ? createPostMutation.error.message
            : "could not publish post."}
        </p>
      ) : null}
    </div>
  );
};
