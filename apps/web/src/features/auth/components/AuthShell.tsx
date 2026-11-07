import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { DuotoneBackdrop } from "@/components/film/DuotoneBackdrop";
import { useTrendingNow } from "@/features/feed/hooks/useFeed";
import { toWeekLabel } from "@/features/media/archive/week-label";
import { useTrendingSeries } from "@/features/tv/hooks/useTv";
import { cn } from "@/lib/utils";
import { getPosterUrl } from "@/features/media/tmdb-images";

const STEPS = [
  { to: "/login", number: "01", label: "Sign in" },
  { to: "/register", number: "02", label: "Join" },
  { to: "/forgot-password", number: "03", label: "Recover" },
] as const;

type StripItem = { key: string; title: string; posterPath: string | null; to: "/movies/$tmdbId" | "/serials/$tmdbId"; tmdbId: number; tone: "film" | "series" };

// Sign in, Join and Recover share one frame, so the trending strip survives moving between them.
export const AuthShell = ({ children }: { children: ReactNode }) => {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const step = STEPS.find((candidate) => pathname.startsWith(candidate.to)) ?? STEPS[0];
  const movies = useTrendingNow(9).data ?? [];
  const series = useTrendingSeries().data ?? [];

  const strip: StripItem[] = [
    ...movies.map((movie) => ({ key: `m${movie.tmdbId}`, title: movie.title, posterPath: movie.posterPath, to: "/movies/$tmdbId" as const, tmdbId: movie.tmdbId, tone: "film" as const })),
    ...series.map((show) => ({ key: `s${show.tmdbId}`, title: show.title, posterPath: show.posterPath, to: "/serials/$tmdbId" as const, tmdbId: show.tmdbId, tone: "series" as const })),
  ].slice(0, 14);

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="overflow-hidden rounded-[3px] border border-[color:var(--line)]">
        <div className="slate mono-meta uppercase">
          <span>{`Interis · Reel ${step.number} · ${step.label}`}</span>
          <span className="hidden sm:inline">{`Trending · ${toWeekLabel(new Date())}`}</span>
        </div>

        <div className="p-5 sm:p-8">
          <nav aria-label="Account steps" className="mono-meta mb-6 flex gap-4 uppercase">
            {STEPS.map((candidate) => (
              <Link
                key={candidate.to}
                to={candidate.to}
                aria-current={candidate === step ? "page" : undefined}
                aria-label={`${candidate.number} ${candidate.label}`}
                className={cn(candidate === step ? "text-foreground" : "text-muted-foreground hover:text-foreground")}
              >
                {`${candidate.number} ${candidate.label}`}
              </Link>
            ))}
          </nav>
          <div className="max-w-md">{children}</div>
        </div>

        {strip.length > 0 ? (
          <div className="flex gap-[3px] overflow-hidden bg-black px-[3px] py-[3px]">
            {strip.map((item) => (
              <Link
                key={item.key}
                to={item.to}
                params={{ tmdbId: String(item.tmdbId) }}
                aria-label={item.title}
                className="relative aspect-[2/3] w-16 shrink-0 overflow-hidden sm:w-20"
              >
                <DuotoneBackdrop tone={item.tone} fade={false}>
                  {item.posterPath ? <img src={getPosterUrl(item.posterPath)} alt="" className="h-full w-full object-cover" /> : null}
                </DuotoneBackdrop>
              </Link>
            ))}
          </div>
        ) : null}

        <div className="slate mono-meta uppercase">
          <span>Logged, not filtered.</span>
          <span />
        </div>
      </div>
    </section>
  );
};
