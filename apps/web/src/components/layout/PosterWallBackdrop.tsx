import { DuotoneBackdrop } from "@/components/film/DuotoneBackdrop";
import { getPosterUrl } from "@/features/movies/components/utils";
import { cn } from "@/lib/utils";

type PosterWallBackdropProps = {
  posterPaths: (string | null)[];
  className?: string;
};

// A wall of trending posters as a duotone, washed toward the page so text on top reads.
export const PosterWallBackdrop = ({ posterPaths, className }: PosterWallBackdropProps) => (
  <div className={cn("absolute inset-0 overflow-hidden", className)}>
    <DuotoneBackdrop tone="neutral" fade={false}>
      <div className="grid h-full w-full grid-cols-4 grid-rows-4 gap-1 sm:grid-cols-8 sm:grid-rows-3">
        {posterPaths.map((posterPath, index) => (
          <img
            key={index}
            src={getPosterUrl(posterPath)}
            alt=""
            loading="eager"
            className="h-full w-full object-cover"
          />
        ))}
      </div>
    </DuotoneBackdrop>
    <div className="absolute inset-0 bg-linear-to-b from-background/90 via-background/85 to-background" />
  </div>
);
