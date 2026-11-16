import { memo, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Slate } from "@/components/film/Slate";
import type { YearReviewTitle } from "@/features/year-review/api";
import { tmdbImageUrl } from "@/lib/tmdb-image";
import { cn } from "@/lib/utils";

type RecapSectionProps = {
  label: string;
  year: number;
  title: string;
  children?: ReactNode;
  className?: string;
};

// One full-width beat of the recap: a slate strip, a bold statement, then its detail.
export const RecapSection = ({ label, year, title, children, className }: RecapSectionProps) => (
  <section aria-label={label} className={cn("animate-fade-up", className)}>
    <Slate left={[label]} right={[String(year)]} />
    <div className="px-1 pt-5 pb-10 sm:pt-7 sm:pb-14">
      <h2 className="font-display text-3xl leading-[1.05] font-bold tracking-tight text-foreground sm:text-5xl">{title}</h2>
      {children}
    </div>
  </section>
);

type BigStatProps = { value: string; label: string; detail?: string | null; tone?: "film" | "series" | "primary" };

const TONE_CLASS = {
  film: "text-[color:var(--film)]",
  series: "text-[color:var(--series)]",
  primary: "text-primary",
} as const;

export const BigStat = ({ value, label, detail, tone }: BigStatProps) => (
  <div className="min-w-0">
    <p className={cn("font-display text-5xl leading-none font-bold tracking-tight sm:text-7xl", tone ? TONE_CLASS[tone] : "text-foreground")}>
      {value}
    </p>
    <p className="kicker mt-2 text-muted-foreground">{label}</p>
    {detail ? <p className="mono-meta mt-1 text-[10px] text-muted-foreground">{detail}</p> : null}
  </div>
);

// A small labelled fact under a section's statement.
export const Fact = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="min-w-0 border-t border-[color:var(--line)] pt-3">
    <p className="kicker text-muted-foreground">{label}</p>
    <div className="mt-1.5">{children}</div>
  </div>
);

type RecapTitleLinkProps = { title: YearReviewTitle; meta?: string | null };

// A title with its tiny poster, linking to its page.
export const RecapTitleLink = memo(({ title, meta }: RecapTitleLinkProps) => {
  const posterUrl = tmdbImageUrl(title.posterPath, "w92");
  return (
    <Link
      to={title.mediaType === "movie" ? "/movies/$tmdbId" : "/serials/$tmdbId"}
      params={{ tmdbId: String(title.tmdbId) }}
      className="group flex min-w-0 items-center gap-3"
      viewTransition
    >
      <span className="block aspect-[2/3] w-10 shrink-0 overflow-hidden rounded-sm border border-[color:var(--line-strong)] bg-card">
        {posterUrl ? <img src={posterUrl} alt="" loading="lazy" className="size-full object-cover" /> : null}
      </span>
      <span className="min-w-0">
        <span className="display-4 block truncate text-foreground group-hover:underline">{title.title}</span>
        {meta ? <span className="mono-meta block text-[10px] text-muted-foreground uppercase">{meta}</span> : null}
      </span>
    </Link>
  );
});
RecapTitleLink.displayName = "RecapTitleLink";
