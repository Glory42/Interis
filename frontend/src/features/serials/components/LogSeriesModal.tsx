import { useEffect, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { Link } from "@tanstack/react-router";
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
import { useAuth } from "@/features/auth/hooks/useAuth";
import { SpaceRatingInput } from "@/features/films/components/SpaceRating";
import { formatRatingOutOfFiveLabel } from "@/features/films/components/spaceRating.utils";
import { useCreateSeriesLog } from "@/features/serials/hooks/useSerials";
import { getPosterUrl } from "@/features/serials/components/utils";
import { isApiError } from "@/lib/api-client";

type LogSeriesModalInitialState = {
  watchedDate: string | null;
  ratingOutOfFive: number | null;
  rewatch: boolean;
  reviewContent: string | null;
  containsSpoilers: boolean | null;
};

type LogSeriesModalProps = {
  tmdbId: number;
  seriesTitle: string;
  seriesFirstAirYear: number | null;
  seriesPosterPath: string | null;
  initialState?: LogSeriesModalInitialState;
};

const todayAsDateInput = (): string => new Date().toISOString().slice(0, 10);
const REVIEW_MAX_LENGTH = 5000;

export const LogSeriesModal = ({
  tmdbId,
  seriesTitle,
  seriesFirstAirYear,
  seriesPosterPath,
  initialState,
}: LogSeriesModalProps) => {
  const { user } = useAuth();
  const createSeriesLogMutation = useCreateSeriesLog(tmdbId);

  const [isOpen, setIsOpen] = useState(false);
  const [watchedDate, setWatchedDate] = useState(todayAsDateInput);
  const [ratingOutOfFive, setRatingOutOfFive] = useState<number | null>(null);
  const [rewatch, setRewatch] = useState(false);
  const [review, setReview] = useState("");
  const [containsSpoilers, setContainsSpoilers] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  const closeModal = () => {
    setIsOpen(false);
    setFormError(null);
  };

  const openModal = () => {
    setWatchedDate(initialState?.watchedDate ?? todayAsDateInput());
    setRatingOutOfFive(initialState?.ratingOutOfFive ?? null);
    setRewatch(initialState?.rewatch ?? false);
    setReview(initialState?.reviewContent ?? "");
    setContainsSpoilers(initialState?.containsSpoilers ?? false);
    setFormError(null);
    setIsOpen(true);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const normalizedReview = review.trim();

    try {
      await createSeriesLogMutation.mutateAsync({
        watchedDate,
        ...(ratingOutOfFive !== null ? { ratingOutOfFive } : {}),
        rewatch,
        ...(normalizedReview.length > 0
          ? {
              review: normalizedReview,
              containsSpoilers,
            }
          : {}),
      });

      closeModal();
    } catch (error) {
      if (isApiError(error)) {
        setFormError(error.message);
        return;
      }

      setFormError("Could not save this review right now.");
    }
  };

  if (!user) {
    return (
      <Button asChild variant="outline" size="sm">
        <Link to="/login" viewTransition>
          Login to review
        </Link>
      </Button>
    );
  }

  const modalNode = (
    <div
      className="theme-modal-overlay fixed inset-0 z-150 flex items-center justify-center bg-background/80 p-2 backdrop-blur-sm sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          closeModal();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="theme-modal-panel relative z-50 flex w-[calc(100vw-1rem)] max-h-[calc(100dvh-1rem)] max-w-4xl flex-col overflow-hidden rounded-2xl border border-border/70 bg-card/95 shadow-2xl backdrop-blur-xl sm:w-[calc(100vw-2rem)] sm:max-h-[calc(100dvh-2rem)]"
      >
        <div className="flex items-start justify-between border-b border-border/60 bg-card/90 px-4 py-3.5 backdrop-blur-sm sm:px-5 sm:py-4">
          <div>
            <h2 className="text-base font-bold text-foreground sm:text-lg">
              Write a Review
            </h2>
            <p className="mt-0.5 text-[11px] text-muted-foreground sm:text-xs">
              {seriesTitle}
              {seriesFirstAirYear ? ` (${seriesFirstAirYear})` : ""}
            </p>
          </div>

          <button
            type="button"
            className="rounded-lg p-1 text-muted-foreground transition-all hover:bg-secondary/60 hover:text-foreground sm:p-1.5"
            onClick={closeModal}
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
                  <div className="w-20 shrink-0 overflow-hidden rounded-lg border border-border/70 bg-background/30 shadow-sm sm:w-24 lg:w-full lg:rounded-xl">
                    <img
                      src={getPosterUrl(seriesPosterPath)}
                      alt={`${seriesTitle} poster`}
                      className="aspect-2/3 w-full object-cover"
                    />
                  </div>

                  <div className="min-w-0 space-y-1 lg:space-y-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                      Reviewing
                    </p>
                    <h3 className="text-sm font-semibold leading-snug text-foreground">
                      {seriesTitle}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {seriesFirstAirYear
                        ? `First aired in ${seriesFirstAirYear}`
                        : "First air year unavailable"}
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
                    onChange={(event) => setWatchedDate(event.target.value)}
                    className="h-10 rounded-lg border-border/70 bg-background/45 sm:h-11 sm:rounded-xl"
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
                    <SpaceRatingInput
                      value={ratingOutOfFive}
                      onChange={setRatingOutOfFive}
                    />

                    <div className="rounded-lg border border-border/70 bg-secondary/35 px-2.5 py-1 text-xs font-semibold text-foreground sm:px-3 sm:py-1.5 sm:text-sm">
                      {formatRatingOutOfFiveLabel(ratingOutOfFive) ?? "Unrated"}
                    </div>
                  </div>
                </section>

                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border/70 bg-secondary/20 p-2.5 transition-colors hover:border-border sm:rounded-xl sm:p-3">
                  <input
                    type="checkbox"
                    checked={rewatch}
                    onChange={(event) => setRewatch(event.target.checked)}
                    className="h-4 w-4 rounded border-border bg-input accent-primary"
                  />
                  <span className="text-sm font-medium text-foreground">
                    I've watched this before
                  </span>
                </label>

                <section className="space-y-2">
                  <label className="block text-sm font-semibold text-foreground">
                    <span className="flex items-center gap-2">
                      <MessageSquare className="h-3.5 w-3.5" />
                      <span>Review</span>
                    </span>
                  </label>
                  <Textarea
                    maxLength={REVIEW_MAX_LENGTH}
                    value={review}
                    onChange={(event) => setReview(event.target.value)}
                    placeholder="Share your thoughts about this series..."
                    className="h-24 rounded-lg border-border/70 bg-background/45 sm:h-28 sm:rounded-xl lg:h-32"
                  />
                </section>

                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-destructive/35 bg-destructive/10 p-2.5 transition-colors hover:border-destructive/50 sm:rounded-xl sm:p-3">
                  <input
                    type="checkbox"
                    checked={containsSpoilers}
                    onChange={(event) =>
                      setContainsSpoilers(event.target.checked)
                    }
                    className="h-4 w-4 rounded border-border bg-input accent-primary"
                  />
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    <span className="text-sm font-medium text-foreground">
                      Review contains spoilers
                    </span>
                  </span>
                </label>

                {formError ? (
                  <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {formError}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="border-t border-border/60 bg-card/90 px-4 py-3 backdrop-blur-sm sm:px-5 sm:py-4 lg:px-6">
            <div className="flex items-center justify-between gap-2 sm:gap-3">
              <Button
                type="button"
                variant="outline"
                className="h-9 flex-1 rounded-lg sm:h-10 sm:rounded-xl"
                onClick={closeModal}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="h-9 flex-1 rounded-lg sm:h-10 sm:rounded-xl"
                disabled={createSeriesLogMutation.isPending}
              >
                {createSeriesLogMutation.isPending ? "Posting..." : "Post Review"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <>
      <Button onClick={openModal} className="rounded-xl">
        Write a Review
      </Button>

      {isOpen ? createPortal(modalNode, document.body) : null}
    </>
  );
};
