import { type FormEvent, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, CalendarDays, MessageSquare, Music, Rocket, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SpaceRatingInput } from "@/features/films/components/SpaceRating";
import { isApiError } from "@/lib/api-client";
import { useCreateTrackLog } from "@/features/music/hooks/useTracks";
import { useCreateReview } from "@/features/reviews/hooks/useReviews";
import { MUSIC_MODULE_STYLES } from "./music-detail/styles";

const REVIEW_MAX_LENGTH = 5000;

const todayAsDateInput = (): string => new Date().toISOString().slice(0, 10);

type LogTrackModalProps = {
  mbid: string;
  trackTitle: string;
  artistName: string;
  isOpen: boolean;
  onClose: () => void;
};

export const LogTrackModal = ({
  mbid,
  trackTitle,
  artistName,
  isOpen,
  onClose,
}: LogTrackModalProps) => {
  const createLogMutation = useCreateTrackLog(mbid);
  const createReviewMutation = useCreateReview();

  const [listenedDate, setListenedDate] = useState(todayAsDateInput);
  const [rating, setRating] = useState<number | null>(null);
  const [relisten, setRelisten] = useState(false);
  const [review, setReview] = useState("");
  const [containsSpoilers, setContainsSpoilers] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Reset the form fields whenever the modal transitions to open - adjusted
  // during render (rather than in an effect) to avoid an extra commit.
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setListenedDate(todayAsDateInput());
      setRating(null);
      setRelisten(false);
      setReview("");
      setContainsSpoilers(false);
      setFormError(null);
    }
  }

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    const normalizedReview = review.trim();
    try {
      const result = await createLogMutation.mutateAsync({
        listenedDate,
        ...(rating !== null ? { rating } : {}),
        relisten,
      });

      if (normalizedReview.length > 0) {
        await createReviewMutation.mutateAsync({
          mediaSourceId: mbid,
          mediaType: "track",
          content: normalizedReview,
          containsSpoilers,
          diaryEntryId: result.entry.id,
        });
      }

      onClose();
    } catch (error) {
      setFormError(isApiError(error) ? error.message : "Could not save this log right now.");
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="theme-modal-overlay fixed inset-0 z-150 flex items-center justify-center bg-background/80 p-2 backdrop-blur-sm sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="theme-modal-panel relative z-50 flex w-[calc(100vw-1rem)] max-h-[calc(100dvh-1rem)] max-w-lg flex-col overflow-hidden border border-border/70 bg-card/95 shadow-2xl backdrop-blur-xl sm:w-[calc(100vw-2rem)]"
      >
        <div className="flex items-start justify-between border-b border-border/60 bg-card/90 px-4 py-3.5 backdrop-blur-sm sm:px-5 sm:py-4">
          <div>
            <h2 className="text-base font-bold text-foreground sm:text-lg">Log Listen</h2>
            <p className="mt-0.5 text-[11px] text-muted-foreground sm:text-xs">
              {trackTitle} · {artistName}
            </p>
          </div>
          <button
            type="button"
            className="p-1 text-muted-foreground transition-all hover:bg-secondary/60 hover:text-foreground sm:p-1.5"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-3 sm:px-5 sm:pb-5 sm:pt-4">
            <div className="grid gap-4 sm:grid-cols-[100px_1fr]">
              <div className="flex items-start justify-center sm:block">
                <div
                  className="aspect-square w-24 overflow-hidden border sm:w-full"
                  style={{ borderColor: MUSIC_MODULE_STYLES.border }}
                >
                  <div
                    className="flex h-full w-full items-center justify-center"
                    style={{ background: MUSIC_MODULE_STYLES.panelSoft }}
                  >
                    <Music className="h-8 w-8" style={{ color: MUSIC_MODULE_STYLES.accent }} />
                  </div>
                </div>
              </div>

              <div className="space-y-3 sm:space-y-4">
                <section className="space-y-2">
                  <label className="block text-sm font-semibold text-foreground">
                    <span className="flex items-center gap-2">
                      <CalendarDays className="h-3.5 w-3.5" />
                      <span>Listened on</span>
                    </span>
                  </label>
                  <Input
                    type="date"
                    required
                    value={listenedDate}
                    max={todayAsDateInput()}
                    onChange={(e) => setListenedDate(e.target.value)}
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
                  <SpaceRatingInput value={rating} onChange={setRating} />
                </section>

                <label className="flex cursor-pointer items-center gap-3 border border-border/70 bg-secondary/20 p-2.5 transition-colors hover:border-border sm:p-3">
                  <input
                    type="checkbox"
                    checked={relisten}
                    onChange={(e) => setRelisten(e.target.checked)}
                    className="h-4 w-4 border-border bg-input accent-primary"
                  />
                  <span className="text-sm font-medium text-foreground">I've listened to this before</span>
                </label>

                <section className="space-y-2">
                  <label className="block text-sm font-semibold text-foreground">
                    <span className="flex items-center gap-2">
                      <MessageSquare className="h-3.5 w-3.5" />
                      <span>Review (optional)</span>
                    </span>
                  </label>
                  <Textarea
                    maxLength={REVIEW_MAX_LENGTH}
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                    placeholder="Share your thoughts about this track..."
                    className="border-border/70 bg-background/45"
                  />
                </section>

                {review.trim().length > 0 ? (
                  <label className="flex cursor-pointer items-center gap-2.5 border border-destructive/35 bg-destructive/10 px-3 py-2.5 transition-colors hover:border-destructive/50">
                    <input
                      type="checkbox"
                      checked={containsSpoilers}
                      onChange={(e) => setContainsSpoilers(e.target.checked)}
                      className="h-4 w-4 shrink-0 border-border bg-input accent-primary"
                    />
                    <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" />
                    <span className="text-sm font-medium text-foreground">Review contains spoilers</span>
                  </label>
                ) : null}

                {formError ? (
                  <p className="border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {formError}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="border-t border-border/60 bg-card/90 px-4 py-3 backdrop-blur-sm sm:px-5 sm:py-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <Button type="button" variant="outline" className="h-9 flex-1 sm:h-10" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="h-9 flex-1 sm:h-10"
                disabled={createLogMutation.isPending || createReviewMutation.isPending}
                style={{ background: MUSIC_MODULE_STYLES.accent, borderColor: MUSIC_MODULE_STYLES.accent }}
              >
                {createLogMutation.isPending || createReviewMutation.isPending
                  ? "Saving..."
                  : "Log Listen"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
};
