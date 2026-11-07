import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { DuotoneBackdrop } from "@/components/film/DuotoneBackdrop";
import { OutlinedRank } from "@/components/film/OutlinedRank";
import { toWeekLabel } from "@/features/media/archive/week-label";
import { cn } from "@/lib/utils";

export type SpotlightItem = {
  tmdbId: number;
  title: string;
  year: number | null;
  // "Directed by …" / "Created by …"
  credit: string | null;
  backdropUrl: string;
  tmdbRating: number | null;
};

type ArchiveSpotlightProps = {
  kindLabel: "Films" | "TV";
  modeLabel: string;
  tone: "film" | "series";
  detailRoute: "/movies/$tmdbId" | "/serials/$tmdbId";
  items: SpotlightItem[];
  now?: Date;
};

const ROTATE_MS = 7000;
const pad = (value: number) => String(value).padStart(2, "0");

const prefersReducedMotion = () =>
  typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// The archive's opening reel: a letterboxed duotone frame that steps through the top titles.
export const ArchiveSpotlight = ({ kindLabel, modeLabel, tone, detailRoute, items, now }: ArchiveSpotlightProps) => {
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const count = items.length;

  useEffect(() => {
    if (count < 2 || isPaused || prefersReducedMotion()) return;
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % count), ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [count, isPaused]);

  if (count === 0) return null;
  const activeIndex = index % count;
  const active = items[activeIndex]!;
  const reelLabel = `Reel ${pad(activeIndex + 1)}/${pad(count)}${
    active.tmdbRating !== null ? ` · TMDB ${active.tmdbRating.toFixed(1)}` : ""
  }`;

  return (
    <section
      aria-label={`${modeLabel} ${kindLabel.toLowerCase()}`}
      className="mb-5 overflow-hidden rounded-[2px]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
    >
      <div className="slate mono-meta uppercase">
        <span>{`Interis · ${kindLabel} · ${modeLabel}`}</span>
        <span>{toWeekLabel(now ?? new Date())}</span>
      </div>

      <Link
        to={detailRoute}
        params={{ tmdbId: String(active.tmdbId) }}
        viewTransition
        className="relative block h-[210px] overflow-hidden sm:h-[300px]"
      >
        <DuotoneBackdrop tone={tone} fade={false}>
          <img key={active.backdropUrl} src={active.backdropUrl} alt="" className="size-full object-cover" />
        </DuotoneBackdrop>
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <OutlinedRank
          value={activeIndex + 1}
          className="absolute top-3 right-4 text-[56px] [-webkit-text-stroke:1.5px_rgba(255,255,255,0.7)] sm:text-[80px]"
        />
        <div className="absolute right-24 bottom-4 left-4">
          {active.credit ? <p className="mono-meta uppercase text-white/80">{active.credit}</p> : null}
          <p className="display-2 leading-tight text-white">
            {active.title}
            {active.year ? <span className="ml-2 text-base font-normal text-white/70">({active.year})</span> : null}
          </p>
        </div>
      </Link>

      <div className="slate mono-meta uppercase">
        <span className="flex gap-1">
          {items.map((item, itemIndex) => (
            <button
              key={item.tmdbId}
              type="button"
              aria-label={`Show ${itemIndex + 1} of ${count}`}
              aria-current={itemIndex === activeIndex}
              onClick={() => setIndex(itemIndex)}
              className={cn("h-2.5 w-4 rounded-[1px] transition-colors", itemIndex > activeIndex && "bg-white/20")}
              style={itemIndex <= activeIndex ? { background: tone === "film" ? "var(--film)" : "var(--series)" } : undefined}
            />
          ))}
        </span>
        <span>{reelLabel}</span>
      </div>
    </section>
  );
};
