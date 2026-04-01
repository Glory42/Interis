import { Link } from "@tanstack/react-router";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { getPosterUrl } from "@/features/films/components/utils";
import type { MeFeedSummary } from "@/features/feed/types";
import type { MeProfile } from "@/types/api";

type MyProfileSummaryRailProps = {
  user: MeProfile | null;
  isLoading: boolean;
  isError: boolean;
  summary: MeFeedSummary | null;
};

export const MyProfileSummaryRail = ({
  user,
  isLoading,
  isError,
  summary,
}: MyProfileSummaryRailProps) => {
  if (!user) {
    return (
      <section className="rounded-2xl border border-border/70 bg-card/70 p-5">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
          My Profile
        </h3>
        <p className="mt-3 text-sm text-muted-foreground">
          Sign in to see your profile snapshot and quick account actions.
        </p>
        <Button asChild size="sm" className="mt-4">
          <Link to="/login">Sign in</Link>
        </Button>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-border/70 bg-card/70 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
          My Profile
        </h3>
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="h-7 rounded-lg px-2"
        >
          <Link to="/settings" aria-label="Open settings">
            <Settings className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner /> Loading profile summary...
        </p>
      ) : null}

      {isError ? (
        <p className="text-sm text-destructive">
          Could not load profile summary.
        </p>
      ) : null}

      {!isLoading && !isError && summary ? (
        <div className="space-y-4">
          <div className="text-center">
            {summary.avatarUrl || summary.image ? (
              <img
                src={summary.avatarUrl ?? summary.image ?? undefined}
                alt={`${summary.username} avatar`}
                className="mx-auto h-16 w-16 rounded-full border border-border/70 object-cover"
              />
            ) : (
              <span className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full border border-border/70 bg-secondary text-lg font-semibold text-secondary-foreground">
                {summary.username.slice(0, 1).toUpperCase()}
              </span>
            )}

            <p className="mt-2 text-base font-bold text-foreground">
              {summary.displayUsername ?? summary.username}
            </p>
            <Link
              to="/profile/$username"
              params={{ username: summary.username }}
              className="text-xs text-muted-foreground hover:text-primary"
              viewTransition
            >
              @{summary.username}
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-1 border-y border-border/60 py-3 text-center">
            <div>
              <p className="text-sm font-bold text-foreground">
                {summary.counts.logs}
              </p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Logs
              </p>
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">
                {summary.counts.followers}
              </p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Followers
              </p>
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">
                {summary.counts.following}
              </p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Following
              </p>
            </div>
          </div>

          {summary.recentPosters.length > 0 ? (
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                Recent Posters
              </p>
              <div className="flex -space-x-2">
                {summary.recentPosters.slice(0, 5).map((movie) => (
                  <Link
                    key={`summary-poster-${movie.tmdbId}`}
                    to="/cinema/$tmdbId"
                    params={{ tmdbId: String(movie.tmdbId) }}
                    className="relative block h-12 w-9 overflow-hidden rounded-md border border-background transition-transform hover:-translate-y-0.5"
                    viewTransition
                  >
                    <img
                      src={getPosterUrl(movie.posterPath)}
                      alt={`${movie.title} poster`}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
};
