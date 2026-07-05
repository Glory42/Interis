import { useState, useEffect, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { X, Heart, Rocket, MessageSquare, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SpaceRatingInput } from "@/features/films/components/SpaceRating";
import { formatRatingOutOfFiveLabel } from "@/features/films/components/spaceRating.utils";

type SeasonEpisodeReviewDialogProps = {
  title: string;
  subtitle: string;
  posterUrl: string;
  initialContent?: string;
  initialContainsSpoilers?: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (data: { content: string; containsSpoilers: boolean }) => void;
  onDelete?: () => void;
  
  // Interactive properties matching LogMediaDialog
  ratingOutOfFive: number | null;
  onRatingChange: (nextValue: number | null) => void;
  liked: boolean;
  onLikedChange: (nextValue: boolean) => void;
  watched: boolean;
  onWatchedChange: (nextValue: boolean) => void;
};

export const SeasonEpisodeReviewDialog = ({
  title,
  subtitle,
  posterUrl,
  initialContent = "",
  initialContainsSpoilers = false,
  isSubmitting,
  onClose,
  onSubmit,
  onDelete,
  ratingOutOfFive,
  onRatingChange,
  liked,
  onLikedChange,
  watched,
  onWatchedChange,
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

  return createPortal(
    <div
      className="fixed inset-0 z-150 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="theme-modal-panel relative z-50 flex w-[calc(100vw-1rem)] max-h-[calc(100dvh-1rem)] max-w-4xl flex-col overflow-hidden border border-border/70 bg-card/95 shadow-2xl backdrop-blur-xl sm:w-[calc(100vw-2rem)] sm:max-h-[calc(100dvh-2rem)]"
      >
        <div className="flex items-start justify-between border-b border-border/60 bg-card/90 px-4 py-3.5 backdrop-blur-sm sm:px-5 sm:py-4">
          <div>
            <h2 className="text-base font-bold text-foreground sm:text-lg">Write a Review</h2>
            <p className="mt-0.5 text-[11px] text-muted-foreground sm:text-xs">
              {title} &middot; {subtitle}
            </p>
          </div>

          <button
            type="button"
            className="p-1 text-muted-foreground transition-all hover:bg-secondary/60 hover:text-foreground sm:p-1.5"
            onClick={onClose}
            aria-label="Close review modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-3 sm:px-5 sm:pb-5 sm:pt-4 lg:px-6 lg:pb-6">
            <div className="grid gap-4 lg:grid-cols-[176px_minmax(0,1fr)] lg:gap-5">
              <aside className="space-y-2.5 lg:space-y-3.5">
                <div className="flex items-start gap-3 lg:block lg:space-y-3">
                  <div className="w-20 shrink-0 overflow-hidden border border-border/70 bg-background/30 shadow-sm sm:w-24 lg:w-full">
                    <img src={posterUrl} alt={`${title} poster`} className="aspect-2/3 w-full object-cover" />
                  </div>

                  <div className="min-w-0 space-y-1 lg:space-y-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                      Reviewing
                    </p>
                    <h3 className="text-sm font-semibold leading-snug text-foreground">{title}</h3>
                    <p className="text-xs text-muted-foreground">{subtitle}</p>
                  </div>
                </div>
              </aside>

              <div className="space-y-3 sm:space-y-3.5 lg:space-y-4">
                {/* Watched Toggle Box */}
                <label className="flex cursor-pointer items-center gap-3 border border-border/70 bg-secondary/20 p-2.5 transition-colors hover:border-border sm:p-3">
                  <input
                    type="checkbox"
                    checked={watched}
                    onChange={(event) => onWatchedChange(event.target.checked)}
                    className="h-4 w-4 border-border bg-input accent-primary"
                  />
                  <span className="text-sm font-medium text-foreground">Mark as Watched</span>
                </label>

                {/* Rating & Like Section */}
                <section className="space-y-2">
                  <label className="block text-sm font-semibold text-foreground">
                    <span className="flex items-center gap-2">
                      <Rocket className="h-3.5 w-3.5" />
                      <span>Rating</span>
                    </span>
                  </label>

                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <SpaceRatingInput value={ratingOutOfFive} onChange={onRatingChange} />

                    <div className="border border-border/70 bg-secondary/35 px-2.5 py-1 text-xs font-semibold text-foreground sm:px-3 sm:py-1.5 sm:text-sm">
                      {formatRatingOutOfFiveLabel(ratingOutOfFive) ?? "Unrated"}
                    </div>

                    <button
                      type="button"
                      onClick={() => onLikedChange(!liked)}
                      className="ml-auto inline-flex items-center justify-center gap-1.5 border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] transition-all hover:bg-secondary/30"
                      style={{
                        borderColor: liked ? "var(--primary)" : "var(--border)",
                        color: liked ? "var(--primary)" : "var(--muted-foreground)",
                        background: liked ? "color-mix(in srgb, var(--primary) 10%, transparent)" : "transparent",
                      }}
                    >
                      <Heart className="h-3.5 w-3.5" fill={liked ? "currentColor" : "transparent"} />
                      <span>{liked ? "Liked" : "Like"}</span>
                    </button>
                  </div>
                </section>

                {/* Review Textarea */}
                <section className="space-y-2">
                  <label className="block text-sm font-semibold text-foreground">
                    <span className="flex items-center gap-2">
                      <MessageSquare className="h-3.5 w-3.5" />
                      <span>Review</span>
                    </span>
                  </label>
                  <Textarea
                    maxLength={10000}
                    value={content}
                    onChange={(event) => setContent(event.target.value)}
                    placeholder="Share your thoughts about this..."
                    className="h-24 border-border/70 bg-background/45 sm:h-28 lg:h-32"
                    required
                  />
                </section>

                {/* Spoilers Toggle Box */}
                <label className="flex cursor-pointer items-center gap-3 border border-destructive/35 bg-destructive/10 p-2.5 transition-colors hover:border-destructive/50 sm:p-3">
                  <input
                    type="checkbox"
                    checked={containsSpoilers}
                    onChange={(event) => setContainsSpoilers(event.target.checked)}
                    className="h-4 w-4 border-border bg-input accent-primary"
                  />
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    <span className="text-sm font-medium text-foreground">Review contains spoilers</span>
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div className="border-t border-border/60 bg-card/90 px-4 py-3 backdrop-blur-sm sm:px-5 sm:py-4 lg:px-6">
            <div className="flex items-center justify-between gap-2 sm:gap-3">
              {onDelete && initialContent ? (
                <Button
                  type="button"
                  variant="destructive"
                  className="h-9 px-4 sm:h-10 font-mono text-xs"
                  onClick={onDelete}
                  disabled={isSubmitting}
                >
                  Delete Review
                </Button>
              ) : (
                <div />
              )}
              <div className="flex items-center gap-2 sm:gap-3 flex-1 justify-end">
                <Button type="button" variant="outline" className="h-9 px-4 sm:h-10 font-mono text-xs" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" className="h-9 px-4 sm:h-10 font-mono text-xs" disabled={isSubmitting || !content.trim()}>
                  {isSubmitting ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
};
