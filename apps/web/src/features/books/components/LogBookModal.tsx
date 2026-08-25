import { type FormEvent, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { BookOpen, CalendarDays, Rocket, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SpaceRatingInput } from "@/features/films/components/SpaceRating";
import { isApiError } from "@/lib/api-client";
import { useCreateBookLog } from "@/features/books/hooks/useBooks";
import { BOOK_MODULE_STYLES } from "./books-detail/styles";

const todayAsDateInput = (): string => new Date().toISOString().slice(0, 10);

type LogBookModalProps = {
  volumeId: string;
  bookTitle: string;
  publishedYear: number | null;
  coverImageUrl: string | null;
  isOpen: boolean;
  onClose: () => void;
};

export const LogBookModal = ({
  volumeId,
  bookTitle,
  publishedYear,
  coverImageUrl,
  isOpen,
  onClose,
}: LogBookModalProps) => {
  const createLogMutation = useCreateBookLog(volumeId);

  const [readDate, setReadDate] = useState(todayAsDateInput);
  const [rating, setRating] = useState<number | null>(null);
  const [reread, setReread] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Reset the form fields whenever the modal transitions to open - adjusted
  // during render (rather than in an effect) to avoid an extra commit.
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setReadDate(todayAsDateInput());
      setRating(null);
      setReread(false);
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
    try {
      await createLogMutation.mutateAsync({
        readDate,
        ...(rating !== null ? { rating } : {}),
        reread,
      });
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
            <h2 className="text-base font-bold text-foreground sm:text-lg">Log Read</h2>
            <p className="mt-0.5 text-[11px] text-muted-foreground sm:text-xs">
              {bookTitle}{publishedYear ? ` (${publishedYear})` : ""}
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
            <div className="grid gap-4 sm:grid-cols-[80px_1fr]">
              <div className="flex items-start justify-center sm:block">
                <div
                  className="w-20 overflow-hidden border sm:w-full"
                  style={{ aspectRatio: "2/3", borderColor: BOOK_MODULE_STYLES.border }}
                >
                  {coverImageUrl ? (
                    <img src={coverImageUrl} alt={`${bookTitle} cover`} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center" style={{ background: BOOK_MODULE_STYLES.panelSoft }}>
                      <BookOpen className="h-8 w-8" style={{ color: BOOK_MODULE_STYLES.accent }} />
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3 sm:space-y-4">
                <section className="space-y-2">
                  <label className="block text-sm font-semibold text-foreground">
                    <span className="flex items-center gap-2">
                      <CalendarDays className="h-3.5 w-3.5" />
                      <span>Read on</span>
                    </span>
                  </label>
                  <Input
                    type="date"
                    required
                    value={readDate}
                    max={todayAsDateInput()}
                    onChange={(e) => setReadDate(e.target.value)}
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
                    checked={reread}
                    onChange={(e) => setReread(e.target.checked)}
                    className="h-4 w-4 border-border bg-input accent-primary"
                  />
                  <span className="text-sm font-medium text-foreground">I've read this before</span>
                </label>

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
                disabled={createLogMutation.isPending}
                style={{ background: BOOK_MODULE_STYLES.accent, borderColor: BOOK_MODULE_STYLES.accent }}
              >
                {createLogMutation.isPending ? "Saving..." : "Log Read"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
};
