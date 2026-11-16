import { memo } from "react";
import { Check, Rocket } from "lucide-react";
import type { OnboardingTitle } from "@/features/onboarding/api";
import { tmdbImageUrl } from "@/lib/tmdb-image";
import { cn } from "@/lib/utils";

type TasteTileProps = {
  title: OnboardingTitle;
  tileKey: string;
  watched: boolean;
  rating: number | null;
  onToggle: (tileKey: string) => void;
};

// One poster in the taste grid: tap to mark it watched, tap again to take it back.
const TasteTileBase = ({ title, tileKey, watched, rating, onToggle }: TasteTileProps) => {
  const posterUrl = tmdbImageUrl(title.posterPath, "w185");
  const isFilm = title.mediaType === "movie";

  return (
    <button
      type="button"
      aria-pressed={watched}
      aria-label={`${title.title}${title.year ? ` (${title.year})` : ""}`}
      onClick={() => onToggle(tileKey)}
      className="group block min-w-0 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <div
        className={cn(
          "relative aspect-[2/3] overflow-hidden rounded-sm border bg-card transition-transform active:translate-y-px",
          watched
            ? isFilm
              ? "border-[color:var(--film)] ring-2 ring-[color:var(--film)]"
              : "border-[color:var(--series)] ring-2 ring-[color:var(--series)]"
            : "border-[color:var(--line-strong)]",
        )}
      >
        {posterUrl ? (
          <img
            src={posterUrl}
            alt=""
            loading="lazy"
            className={cn("size-full object-cover transition-opacity", watched ? "opacity-60" : "group-hover:opacity-90")}
          />
        ) : (
          <div aria-hidden className="flex size-full items-end p-2 font-display text-sm leading-tight font-bold text-foreground">
            {title.title}
          </div>
        )}
        {watched ? (
          <span
            aria-hidden
            className={cn(
              "absolute top-1.5 right-1.5 flex size-6 items-center justify-center rounded-full text-background animate-fade-up",
              isFilm ? "bg-[color:var(--film)]" : "bg-[color:var(--series)]",
            )}
          >
            <Check className="size-3.5" strokeWidth={3} />
          </span>
        ) : null}
        {watched && rating !== null ? (
          <span className="absolute inset-x-0 bottom-0 flex items-center justify-end gap-0.5 bg-background/85 px-1.5 py-[3px] font-mono text-[10px] font-semibold text-primary">
            <Rocket aria-hidden className="size-2.5" />
            {rating.toFixed(1)}
          </span>
        ) : null}
      </div>
      <p className="mt-1 truncate text-[11px] font-semibold text-foreground">{title.title}</p>
      <p className="truncate font-mono text-[10px] text-muted-foreground uppercase">
        {[title.year, isFilm ? "Film" : "TV"].filter(Boolean).join(" · ")}
      </p>
    </button>
  );
};

// The grid re-renders on every tap; memo keeps the other tiles still.
export const TasteTile = memo(TasteTileBase);
