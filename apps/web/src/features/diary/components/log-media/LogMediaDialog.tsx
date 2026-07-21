import type { FormEvent } from "react";
import {
  AlertTriangle,
  MessageSquare,
  Rocket,
  X,
  Heart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModalShell } from "@/components/ui/ModalShell";
import { Textarea } from "@/components/ui/textarea";
import { SpaceRatingInput } from "@/features/films/components/SpaceRating";
import { CalendarPicker } from "@/components/ui/CalendarPicker";
import { todayAsLocalDateInput } from "@/lib/time";

type LogMediaDialogProps = {
  title: string;
  posterUrl: string;
  rating: number | null;
  liked: boolean;
  review: string;
  containsSpoilers: boolean;
  formError: string | null;
  reviewMaxLength: number;
  reviewPlaceholder: string;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onRatingChange: (nextValue: number | null) => void;
  onLikedChange: (nextValue: boolean) => void;
  onReviewChange: (nextValue: string) => void;
  onContainsSpoilersChange: (nextValue: boolean) => void;
  // Aside identity — either year-based or a freeform subtitle
  year?: number | null;
  yearDescriptionLabel?: string;
  subtitle?: string;
  // Date-picker mode (movie / series log)
  watchedDate?: string;
  onWatchedDateChange?: (nextValue: string) => void;
  rewatch?: boolean;
  onRewatchChange?: (nextValue: boolean) => void;
  // Simple watched-toggle mode (season / episode review)
  watched?: boolean;
  onWatchedChange?: (nextValue: boolean) => void;
  // Footer extras
  onDelete?: () => void;
  submitLabel?: string;
};

export const LogMediaDialog = ({
  title,
  posterUrl,
  rating,
  liked,
  review,
  containsSpoilers,
  formError,
  reviewMaxLength,
  reviewPlaceholder,
  isSubmitting,
  onClose,
  onSubmit,
  onRatingChange,
  onLikedChange,
  onReviewChange,
  onContainsSpoilersChange,
  year,
  yearDescriptionLabel,
  subtitle,
  watchedDate,
  onWatchedDateChange,
  rewatch,
  onRewatchChange,
  watched,
  onWatchedChange,
  onDelete,
  submitLabel = "Post Review",
}: LogMediaDialogProps) => {
  const headerSubtitle = subtitle
    ? `${title} · ${subtitle}`
    : `${title}${year ? ` (${year})` : ""}`;

  const asideDescription = subtitle
    ?? (year ? `${yearDescriptionLabel} ${year}` : yearDescriptionLabel ? `${yearDescriptionLabel} unavailable` : null);

  return (
    <ModalShell
      onClose={onClose}
      portal={false}
      closeOnEscape={false}
      overlayClassName="z-150 bg-background/80 p-2 sm:p-4"
      containerClassName="p-0"
      ariaCloseLabel="Close review modal"
    >
      <div
        role="dialog"
        aria-modal="true"
        className="theme-modal-panel relative z-50 flex w-[calc(100vw-1rem)] max-h-[calc(100dvh-1rem)] max-w-4xl flex-col overflow-hidden border border-border/70 bg-card/95 shadow-2xl backdrop-blur-xl sm:w-[calc(100vw-2rem)] sm:max-h-[calc(100dvh-2rem)]"
      >
        <div className="flex items-start justify-between border-b border-border/60 bg-card/90 px-4 py-3.5 backdrop-blur-sm sm:px-5 sm:py-4">
          <div>
            <h2 className="text-base font-bold text-foreground sm:text-lg">Write a Review</h2>
            <p className="mt-0.5 text-[11px] text-muted-foreground sm:text-xs">{headerSubtitle}</p>
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

        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
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
                    {asideDescription && (
                      <p className="text-xs text-muted-foreground">{asideDescription}</p>
                    )}
                  </div>
                </div>
              </aside>

              <div className="space-y-5 sm:space-y-6 lg:space-y-7">
                {/* Top row — date+rewatch, simple watched toggle, or nothing */}
                {watchedDate !== undefined && onWatchedDateChange ? (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
                    <div className="sm:flex-1">
                      <CalendarPicker
                        value={watchedDate}
                        max={todayAsLocalDateInput()}
                        onChange={onWatchedDateChange}
                      />
                    </div>
                    {rewatch !== undefined && onRewatchChange && (
                      <label className="flex cursor-pointer items-center gap-2.5 border border-border/70 bg-secondary/20 px-3 py-2.5 transition-colors hover:border-border sm:shrink-0">
                        <input
                          type="checkbox"
                          checked={rewatch}
                          onChange={(event) => onRewatchChange(event.target.checked)}
                          className="h-4 w-4 shrink-0 border-border bg-input accent-primary"
                        />
                        <span className="text-sm font-medium text-foreground">I've watched this before</span>
                      </label>
                    )}
                  </div>
                ) : watched !== undefined && onWatchedChange ? (
                  <label className="flex cursor-pointer items-center gap-3 border border-border/70 bg-secondary/20 p-2.5 transition-colors hover:border-border sm:p-3">
                    <input
                      type="checkbox"
                      checked={watched}
                      onChange={(event) => onWatchedChange(event.target.checked)}
                      className="h-4 w-4 border-border bg-input accent-primary"
                    />
                    <span className="text-sm font-medium text-foreground">Mark as Watched</span>
                  </label>
                ) : null}

                {/* Middle: Rating (left) + Review textarea (right) */}
                <div className="flex gap-4 items-stretch">
                  <section className="shrink-0 space-y-2">
                    <label className="block text-sm font-semibold text-foreground">
                      <span className="flex items-center gap-2">
                        <Rocket className="h-3.5 w-3.5" />
                        <span>Rating</span>
                      </span>
                    </label>
                    <SpaceRatingInput value={rating} onChange={onRatingChange} autoSave />
                  </section>

                  <section className="flex min-w-0 flex-1 flex-col gap-2">
                    <label className="block text-sm font-semibold text-foreground">
                      <span className="flex items-center gap-2">
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span>Review</span>
                      </span>
                    </label>
                    <Textarea
                      maxLength={reviewMaxLength}
                      value={review}
                      onChange={(event) => onReviewChange(event.target.value)}
                      placeholder={reviewPlaceholder}
                      className="flex-1 border-border/70 bg-background/45"
                    />
                  </section>
                </div>

                {/* Bottom: Like + Spoilers */}
                <div className="flex items-stretch gap-2">
                  <button
                    type="button"
                    onClick={() => onLikedChange(!liked)}
                    className="inline-flex shrink-0 items-center justify-center gap-1.5 border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] transition-all hover:bg-secondary/30"
                    style={{
                      borderColor: liked ? "var(--primary)" : "var(--border)",
                      color: liked ? "var(--primary)" : "var(--muted-foreground)",
                      background: liked ? "color-mix(in srgb, var(--primary) 10%, transparent)" : "transparent",
                    }}
                  >
                    <Heart className="h-3.5 w-3.5" fill={liked ? "currentColor" : "transparent"} />
                    <span>{liked ? "Liked" : "Like"}</span>
                  </button>

                  <label className="flex flex-1 cursor-pointer items-center gap-2.5 border border-destructive/35 bg-destructive/10 px-3 py-2 transition-colors hover:border-destructive/50">
                    <input
                      type="checkbox"
                      checked={containsSpoilers}
                      onChange={(event) => onContainsSpoilersChange(event.target.checked)}
                      className="h-4 w-4 shrink-0 border-border bg-input accent-primary"
                    />
                    <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" />
                    <span className="text-sm font-medium text-foreground">Review contains spoilers</span>
                  </label>
                </div>

                {formError ? (
                  <p
                    role="alert"
                    className="border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                  >
                    {formError}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="border-t border-border/60 bg-card/90 px-4 py-3 backdrop-blur-sm sm:px-5 sm:py-4 lg:px-6">
            <div className="flex items-center justify-between gap-2 sm:gap-3">
              {onDelete ? (
                <Button
                  type="button"
                  variant="danger"
                  className="h-9 px-4 sm:h-10 font-mono text-xs"
                  onClick={onDelete}
                  disabled={isSubmitting}
                >
                  Delete Review
                </Button>
              ) : (
                <div />
              )}
              <div className="flex flex-1 items-center justify-end gap-2 sm:gap-3">
                <Button type="button" variant="outline" className="h-9 px-4 sm:h-10" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" className="h-9 px-4 sm:h-10" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : submitLabel}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </ModalShell>
  );
};
