import { useState, useEffect, type FormEvent } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type SeasonEpisodeReviewDialogProps = {
  title: string;
  subtitle: string;
  initialContent?: string;
  initialContainsSpoilers?: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (data: { content: string; containsSpoilers: boolean }) => void;
  onDelete?: () => void;
};

export const SeasonEpisodeReviewDialog = ({
  title,
  subtitle,
  initialContent = "",
  initialContainsSpoilers = false,
  isSubmitting,
  onClose,
  onSubmit,
  onDelete,
}: SeasonEpisodeReviewDialogProps) => {
  const [content, setContent] = useState(initialContent);
  const [containsSpoilers, setContainsSpoilers] = useState(initialContainsSpoilers);

  useEffect(() => {
    setContent(initialContent);
    setContainsSpoilers(initialContainsSpoilers);
  }, [initialContent, initialContainsSpoilers]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    onSubmit({ content: content.trim(), containsSpoilers });
  };

  return (
    <div
      className="fixed inset-0 z-150 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-lg border border-border/70 bg-card/95 p-6 shadow-2xl backdrop-blur-xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="font-mono text-base font-bold text-foreground">Write a Review</h2>
            <p className="mt-0.5 font-mono text-xs text-muted-foreground">
              {title} &middot; {subtitle}
            </p>
          </div>
          <button
            type="button"
            className="p-1 text-muted-foreground transition-all hover:bg-secondary/60 hover:text-foreground"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share your thoughts about this..."
            rows={5}
            className="w-full bg-background/30 font-mono text-xs"
            required
            maxLength={10000}
          />

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="containsSpoilers"
              checked={containsSpoilers}
              onChange={(e) => setContainsSpoilers(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 bg-background/30 text-primary focus:ring-primary"
            />
            <label
              htmlFor="containsSpoilers"
              className="font-mono text-xs text-muted-foreground select-none cursor-pointer"
            >
              Contains spoilers
            </label>
          </div>

          <div className="flex items-center justify-between gap-3 pt-2">
            {onDelete && initialContent ? (
              <Button
                type="button"
                variant="destructive"
                onClick={onDelete}
                disabled={isSubmitting}
                className="font-mono text-xs"
              >
                Delete Review
              </Button>
            ) : (
              <div />
            )}
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                className="font-mono text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !content.trim()}
                className="font-mono text-xs"
              >
                {isSubmitting ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
