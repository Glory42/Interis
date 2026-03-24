import { useEffect, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { Link } from "@tanstack/react-router";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useCreateDiaryEntry } from "@/features/diary/hooks/useDiary";
import { isApiError } from "@/lib/api-client";

type LogFilmModalProps = {
  tmdbId: number;
  movieTitle: string;
};

const todayAsDateInput = (): string => new Date().toISOString().slice(0, 10);

const popPhrases = [
  "Clapperboard is ready. Drop your hot take.",
  "Scene is yours. Tell us how it hit you.",
  "One line can start a film war. Go.",
] as const;

const randomPhrase = (): string => {
  return popPhrases[Math.floor(Math.random() * popPhrases.length)] ?? popPhrases[0];
};

export const LogFilmModal = ({ tmdbId, movieTitle }: LogFilmModalProps) => {
  const { user } = useAuth();
  const createDiaryMutation = useCreateDiaryEntry();

  const [isOpen, setIsOpen] = useState(false);
  const [watchedDate, setWatchedDate] = useState(todayAsDateInput);
  const [rating, setRating] = useState("");
  const [rewatch, setRewatch] = useState(false);
  const [review, setReview] = useState("");
  const [containsSpoilers, setContainsSpoilers] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [modalPhrase, setModalPhrase] = useState<string>(popPhrases[0]);

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

  const resetForm = () => {
    setWatchedDate(todayAsDateInput());
    setRating("");
    setRewatch(false);
    setReview("");
    setContainsSpoilers(false);
    setFormError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const numericRating = rating.trim().length > 0 ? Number(rating) : undefined;
    if (numericRating !== undefined) {
      if (!Number.isInteger(numericRating) || numericRating < 0 || numericRating > 10) {
        setFormError("Rating must be an integer between 0 and 10.");
        return;
      }
    }

    const normalizedReview = review.trim();

    try {
      await createDiaryMutation.mutateAsync({
        tmdbId,
        watchedDate,
        rating: numericRating,
        rewatch,
        ...(normalizedReview.length > 0
          ? {
              review: normalizedReview,
              containsSpoilers,
            }
          : {}),
      });

      resetForm();
      closeModal();
    } catch (error) {
      if (isApiError(error)) {
        setFormError(error.message);
        return;
      }

      setFormError("Could not save this entry right now.");
    }
  };

  if (!user) {
    return (
      <Button asChild variant="outline">
        <Link to="/login" viewTransition startTransition>
          Login to review or log
        </Link>
      </Button>
    );
  }

  const modalNode = (
    <div className="fixed inset-0 z-[130] flex items-end justify-center bg-background/75 p-4 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-2xl animate-fade-up">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-foreground">Review / Log</h3>
            <p className="text-sm text-muted-foreground">{movieTitle}</p>
            <p className="text-xs text-primary">{modalPhrase}</p>
          </div>

          <button
            className="rounded-md p-1 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
            onClick={closeModal}
            aria-label="Close"
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="watched-date">
              Watched date
            </label>
            <Input
              id="watched-date"
              type="date"
              value={watchedDate}
              onChange={(event) => setWatchedDate(event.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="rating">
              Rating
            </label>
            <Input
              id="rating"
              type="number"
              min={0}
              max={10}
              step={1}
              value={rating}
              onChange={(event) => setRating(event.target.value)}
              placeholder="Leave empty if unrated"
            />
            <p className="text-xs text-muted-foreground">Optional integer score between 0 and 10.</p>
          </div>

          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={rewatch}
              onChange={(event) => setRewatch(event.target.checked)}
              className="h-4 w-4 rounded border border-border bg-input accent-primary"
            />
            This was a rewatch
          </label>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="review">
              Review (optional)
            </label>
            <Textarea
              id="review"
              value={review}
              onChange={(event) => setReview(event.target.value)}
              maxLength={5000}
              placeholder="Write what you thought about this film..."
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={containsSpoilers}
              onChange={(event) => setContainsSpoilers(event.target.checked)}
              className="h-4 w-4 rounded border border-border bg-input accent-primary"
              disabled={review.trim().length === 0}
            />
            Review contains spoilers
          </label>

          {formError ? (
            <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {formError}
            </p>
          ) : null}

          <div className="flex items-center justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" disabled={createDiaryMutation.isPending}>
              {createDiaryMutation.isPending ? "Saving..." : "Save entry"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <>
      <Button
        onClick={() => {
          setModalPhrase(randomPhrase());
          setIsOpen(true);
        }}
      >
        Review / Log
      </Button>

      {isOpen ? createPortal(modalNode, document.body) : null}
    </>
  );
};
