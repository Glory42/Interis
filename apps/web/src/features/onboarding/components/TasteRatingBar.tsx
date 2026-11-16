import { LaunchTrack } from "@/components/film/rating/LaunchTrack";
import type { OnboardingTitle } from "@/features/onboarding/api";

type TasteRatingBarProps = {
  // The title tapped last, while it's still marked watched.
  title: OnboardingTitle | null;
  rating: number | null;
  onRate: (rating: number | null) => void;
};

// Rating is optional: the bar offers it for the last title you tapped.
export const TasteRatingBar = ({ title, rating, onRate }: TasteRatingBarProps) => {
  if (!title) {
    return (
      <p className="body-s text-muted-foreground">
        Tap what you've seen. You can rate each one too, if you like.
      </p>
    );
  }

  return (
    <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
      <p className="min-w-0 truncate text-xs text-muted-foreground sm:w-48 sm:shrink-0 sm:self-start sm:pt-2.5">
        Rate <span className="font-semibold text-foreground">{title.title}</span>
        <span className="font-mono"> · optional</span>
      </p>
      <LaunchTrack
        key={`${title.mediaType}:${title.tmdbId}`}
        value={rating}
        onCommit={onRate}
        accentColor={title.mediaType === "movie" ? "var(--film)" : "var(--series)"}
        ariaLabel={`Your rating for ${title.title}, out of 10`}
        className="min-w-0 flex-1"
      />
    </div>
  );
};
