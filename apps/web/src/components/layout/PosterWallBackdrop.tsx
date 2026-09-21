import { getPosterUrl } from "@/features/films/components/utils";
import { cn } from "@/lib/utils";

type PosterWallBackdropProps = {
  posterPaths: (string | null)[];
  className?: string;
};

export const PosterWallBackdrop = ({ posterPaths, className }: PosterWallBackdropProps) => (
  <div className={cn("theme-hero-shell absolute inset-0 overflow-hidden", className)}>
    <div className="theme-hero-media grid h-full w-full grid-cols-4 grid-rows-4 gap-1 sm:grid-cols-8 sm:grid-rows-3">
      {posterPaths.map((posterPath, index) => (
        <img
          key={index}
          src={getPosterUrl(posterPath)}
          alt=""
          aria-hidden="true"
          loading="eager"
          className="h-full w-full object-cover opacity-80 blur-[1px]"
        />
      ))}
    </div>
    <div className="theme-hero-gradient-layer absolute inset-0" />
    <div className="theme-hero-pattern-layer absolute inset-0" />
    <div className="theme-hero-readable-overlay absolute inset-0 bg-linear-to-b from-background/80 via-background/75 to-background" />
    <div className="theme-hero-readable-overlay absolute inset-0 bg-linear-to-t from-background/50 via-transparent to-background/60" />
  </div>
);
