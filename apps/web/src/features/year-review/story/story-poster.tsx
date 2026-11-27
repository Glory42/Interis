import { cn } from "@/lib/utils";
import { tmdbImageUrl } from "@/lib/tmdb-image";
import type { YearReviewTitle } from "../api";

type StoryPosterProps = {
  title: YearReviewTitle;
  size?: "hero" | "grid";
  priority?: boolean;
  className?: string;
};

export const StoryPoster = ({ title, size = "grid", priority = false, className }: StoryPosterProps) => {
  const url = tmdbImageUrl(title.posterPath, size === "hero" ? "w342" : "w185");
  return (
    <span className={cn("recap-poster", `recap-poster-${size}`, className)}>
      {url ? (
        <img src={url} alt="" loading={priority ? "eager" : "lazy"} decoding="async" />
      ) : (
        <span className="recap-poster-fallback">{title.title}</span>
      )}
    </span>
  );
};

export const StoryPosterPath = ({
  path,
  className,
  priority = false,
}: {
  path: string | null;
  className?: string;
  priority?: boolean;
}) => {
  const url = tmdbImageUrl(path, "w185");
  return (
    <span className={cn("recap-poster", "recap-poster-grid", className)}>
      {url ? <img src={url} alt="" loading={priority ? "eager" : "lazy"} decoding="async" /> : null}
    </span>
  );
};
