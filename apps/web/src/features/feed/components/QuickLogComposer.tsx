import { Link } from "@tanstack/react-router";
import { useState, type KeyboardEvent } from "react";
import { PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FeedActorAvatar } from "@/features/feed/components/FeedActorAvatar";
import { Textarea } from "@/components/ui/textarea";
import { useCreatePost } from "@/features/posts/hooks/usePosts";
import type { MeProfile } from "@/types/api";
import { TickLoader } from "@/components/ui/tick-loader";
import { PHONE_QUERY, useMediaQuery } from "@/lib/use-media-query";

type QuickLogComposerProps = {
  user: MeProfile | null;
};

export const QuickLogComposer = ({ user }: QuickLogComposerProps) => {
  const createPostMutation = useCreatePost();
  const [content, setContent] = useState("");
  const prompt = useMediaQuery(PHONE_QUERY) ? "What did you watch?" : "What did you watch tonight?";

  if (!user) {
    return (
      <div>
        <p className="theme-kicker text-[10px] text-muted-foreground">
          Log console locked
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in to publish quick log entries.
        </p>
        <Button asChild size="sm" className="mt-3">
          <Link to="/login">Sign in</Link>
        </Button>
      </div>
    );
  }

  const profileInitial = user.username.slice(0, 1).toUpperCase();
  const avatarUrl = user.avatarUrl ?? null;
  const trimmedContent = content.trim();
  const canSubmit =
    trimmedContent.length > 0 &&
    trimmedContent.length <= 250 &&
    !createPostMutation.isPending;

  // mutate, not mutateAsync: a failed post shows its error below instead of an unhandled rejection.
  const handleSubmit = () => {
    if (!canSubmit) {
      return;
    }

    createPostMutation.mutate({ content: trimmedContent }, { onSuccess: () => setContent("") });
  };

  const handleTextareaKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter" || event.shiftKey) {
      return;
    }

    event.preventDefault();
    handleSubmit();
  };

  return (
    <div>
      <div className="flex items-center gap-2 sm:gap-3">
        <FeedActorAvatar
          avatarUrl={avatarUrl}
          username={user.username}
          initial={profileInitial}
          className="flex size-8 shrink-0 sm:size-10 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-xs font-bold text-primary"
        />

        <Textarea
          rows={1}
          value={content}
          onKeyDown={handleTextareaKeyDown}
          onChange={(event) => {
            if (event.target.value.length <= 250) {
              setContent(event.target.value);
            }
          }}
          placeholder={prompt}
          aria-label={prompt}
          // 16px keeps iOS from zooming in on focus; phones get the shorter prompt instead.
          className="field-sizing-content min-h-0 min-w-0 flex-1 resize-none border-0 bg-transparent px-0 py-2 text-base shadow-none focus-visible:ring-0"
        />

        <Button
          type="button"
          className="shrink-0 gap-1.5 px-3 font-bold sm:px-4"
          disabled={!canSubmit}
          onClick={handleSubmit}
        >
          {createPostMutation.isPending ? <TickLoader /> : <PenLine aria-hidden className="size-4" />}
          <span className="max-[359px]:sr-only">Log</span>
        </Button>
      </div>

      {content.length > 0 ? (
        <p className="theme-kicker mt-1 truncate pl-10 text-[9px] text-muted-foreground sm:pl-13">
          Enter posts · Shift+Enter newline · {content.length}/250
        </p>
      ) : null}

      {createPostMutation.isError ? (
        <p className="mt-2 text-xs text-destructive">
          {createPostMutation.error instanceof Error
            ? createPostMutation.error.message
            : "Could not publish post."}
        </p>
      ) : null}
    </div>
  );
};
