import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
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
      <div className="rounded-2xl border border-border/70 bg-card/70 p-4">
        <p className="text-sm text-muted-foreground">
          Sign in to post updates, log films, and see personalized following
          activity.
        </p>
        <Button asChild size="sm" className="mt-3">
          <Link to="/login">Sign in to start logging</Link>
        </Button>
      </div>
    );
  }

  const avatarUrl = user.avatarUrl ?? user.image ?? null;
  const profileInitial = user.username.slice(0, 1).toUpperCase();
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

  return (
    <div className="rounded-2xl border border-border/70 bg-card/70 p-4">
      <div className="flex items-start gap-3">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={`${user.username} avatar`}
            className="h-9 w-9 rounded-full border border-border/70 object-cover"
          />
        ) : (
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-secondary text-xs font-semibold text-secondary-foreground">
            {profileInitial}
          </span>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-end gap-2">
            <Textarea
              value={content}
              onChange={(event) => {
                if (event.target.value.length <= 250) {
                  setContent(event.target.value);
                }
              }}
              placeholder="Share a film thought with your followers..."
              className="min-h-0 flex-1 resize-y rounded-xl border-border/70 bg-background/35"
            />

            <Button
              type="button"
              size="sm"
              className="h-10 shrink-0 rounded-xl px-4"
              disabled={!canSubmit}
              onClick={() => {
                void handleSubmit();
              }}
            >
              {createPostMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Post
            </Button>
          </div>
        </div>
      </div>

      {createPostMutation.isError ? (
        <p className="mt-3 text-xs text-destructive">
          {createPostMutation.error instanceof Error
            ? createPostMutation.error.message
            : "Could not publish post."}
        </p>
      ) : null}
    </div>
  );
};
