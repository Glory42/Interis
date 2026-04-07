import type { FormEvent } from "react";
import {
  AlertTriangle,
  CalendarDays,
  MessageSquare,
  Rocket,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SpaceRatingInput } from "@/features/films/components/SpaceRating";
import { formatRatingOutOfFiveLabel } from "@/features/films/components/spaceRating.utils";

const todayAsDateInput = (): string => new Date().toISOString().slice(0, 10);

type LogMediaDialogProps = {
  title: string;
  year: number | null;
  yearDescriptionLabel: string;
  posterUrl: string;
  watchedDate: string;
  ratingOutOfFive: number | null;
  rewatch: boolean;
  review: string;
  containsSpoilers: boolean;
  formError: string | null;
  reviewMaxLength: number;
  reviewPlaceholder: string;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onWatchedDateChange: (nextValue: string) => void;
  onRatingChange: (nextValue: number | null) => void;
  onRewatchChange: (nextValue: boolean) => void;
  onReviewChange: (nextValue: string) => void;
  onContainsSpoilersChange: (nextValue: boolean) => void;
};

export const LogMediaDialog = ({
  title,
  year,
  yearDescriptionLabel,
  posterUrl,
  watchedDate,
  ratingOutOfFive,
  rewatch,
  review,
  containsSpoilers,
  formError,
  reviewMaxLength,
  reviewPlaceholder,
  isSubmitting,
  onClose,
  onSubmit,
  onWatchedDateChange,
  onRatingChange,
  onRewatchChange,
  onReviewChange,
  onContainsSpoilersChange,
}: LogMediaDialogProps) => {
  return (
    <div
      className="theme-modal-overlay fixed inset-0 z-150 flex items-center justify-center bg-background/80 p-2 backdrop-blur-sm sm:p-4"
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
              {title}
              {year ? ` (${year})` : ""}
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
                    <p className="text-xs text-muted-foreground">
                      {year ? `${yearDescriptionLabel} ${year}` : `${yearDescriptionLabel} unavailable`}
                    </p>
                  </div>
                </div>
              </aside>

              <div className="space-y-3 sm:space-y-3.5 lg:space-y-4">
                <section className="space-y-2">
                  <label className="block text-sm font-semibold text-foreground">
                    <span className="flex items-center gap-2">
                      <CalendarDays className="h-3.5 w-3.5" />
                      <span>Watched on</span>
                    </span>
                  </label>
                  <Input
                    type="date"
                    required
                    value={watchedDate}
                    max={todayAsDateInput()}
                    onChange={(event) => onWatchedDateChange(event.target.value)}
                    className="h-10 border-border/70 bg-background/45 sm:h-11"
                  />
                </section>

                <section className="space-y-2">
                  <label className="block text-sm font-semibold text-foreground">
                    <span className="flex items-center gap-2">
                      <Rocket className="h-3.5 w-3.5" />
                      <span>Rating</span>
                    </span>
                  </label>

                  <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                    <SpaceRatingInput value={ratingOutOfFive} onChange={onRatingChange} />

                    <div className="border border-border/70 bg-secondary/35 px-2.5 py-1 text-xs font-semibold text-foreground sm:px-3 sm:py-1.5 sm:text-sm">
                      {formatRatingOutOfFiveLabel(ratingOutOfFive) ?? "Unrated"}
                    </div>
                  </div>
                </section>

                <label className="flex cursor-pointer items-center gap-3 border border-border/70 bg-secondary/20 p-2.5 transition-colors hover:border-border sm:p-3">
                  <input
                    type="checkbox"
                    checked={rewatch}
                    onChange={(event) => onRewatchChange(event.target.checked)}
                    className="h-4 w-4 border-border bg-input accent-primary"
                  />
                  <span className="text-sm font-medium text-foreground">I've watched this before</span>
                </label>

                <section className="space-y-2">
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
                    className="h-24 border-border/70 bg-background/45 sm:h-28 lg:h-32"
                  />
                </section>

                <label className="flex cursor-pointer items-center gap-3 border border-destructive/35 bg-destructive/10 p-2.5 transition-colors hover:border-destructive/50 sm:p-3">
                  <input
                    type="checkbox"
                    checked={containsSpoilers}
                    onChange={(event) => onContainsSpoilersChange(event.target.checked)}
                    className="h-4 w-4 border-border bg-input accent-primary"
                  />
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    <span className="text-sm font-medium text-foreground">Review contains spoilers</span>
                  </span>
                </label>

                {formError ? (
                  <p className="border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {formError}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="border-t border-border/60 bg-card/90 px-4 py-3 backdrop-blur-sm sm:px-5 sm:py-4 lg:px-6">
            <div className="flex items-center justify-between gap-2 sm:gap-3">
              <Button type="button" variant="outline" className="h-9 flex-1 sm:h-10" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" className="h-9 flex-1 sm:h-10" disabled={isSubmitting}>
                {isSubmitting ? "Posting..." : "Post Review"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
