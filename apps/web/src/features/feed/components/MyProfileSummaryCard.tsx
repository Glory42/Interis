import { Link } from "@tanstack/react-router";
import { FeedActorAvatar } from "@/features/feed/components/FeedActorAvatar";
import { getPosterUrl } from "@/features/films/components/utils";
import type { MeFeedSummary } from "@/features/feed/types";
import type { MeProfile } from "@/types/api";

type MyProfileSummaryCardProps = {
  user: MeProfile | null;
  isLoading: boolean;
  isError: boolean;
  summary: MeFeedSummary | null;
};

export const MyProfileSummaryCard = ({
  user,
  isLoading,
  isError,
  summary,
}: MyProfileSummaryCardProps) => {
  if (!user) {
    return (
      <section className="border border-border/50 bg-card/30 p-5">
        <p className="theme-kicker mb-2 text-[9px] text-primary">Your profile</p>
        <p className="text-xs text-muted-foreground">
          Sign in to see your stats and recent activity.
        </p>
        <Link
          to="/login"
          className="mt-3 inline-block border border-primary/45 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/15"
        >
          Sign in
        </Link>
      </section>
    );
  }

  if (isLoading || !summary) {
    return (
      <section className="border border-border/50 bg-card/30 p-5">
        <div className="flex animate-pulse items-center gap-3">
          <div className="h-12 w-12 shrink-0 bg-muted/40" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-3 w-24 bg-muted/40" />
            <div className="h-2.5 w-16 bg-muted/25" />
          </div>
        </div>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="border border-border/50 bg-card/30 p-5">
        <p className="text-xs text-destructive">Could not load your profile.</p>
      </section>
    );
  }

  const displayName = summary.displayUsername ?? summary.username;

  return (
    <section className="border border-border/50 bg-card/30 p-5">
      <Link
        to="/profile/$username"
        params={{ username: summary.username }}
        className="group -m-2 flex items-center gap-3 border border-transparent p-2 transition-colors hover:border-border/60"
        viewTransition
      >
        <FeedActorAvatar
          avatarUrl={summary.avatarUrl}
          username={summary.username}
          initial={summary.username.slice(0, 1).toUpperCase()}
          className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden text-base font-bold text-foreground"
          style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))" }}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-foreground group-hover:text-primary">
            {displayName}
          </p>
          <p className="truncate text-xs text-muted-foreground">@{summary.username}</p>
        </div>
      </Link>

      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border/50 pt-4 text-center">
        <div>
          <p className="text-base font-bold text-foreground">{summary.counts.logs}</p>
          <p className="theme-kicker mt-0.5 text-[8px] text-muted-foreground">Logs</p>
        </div>
        <div>
          <p className="text-base font-bold text-foreground">{summary.counts.followers}</p>
          <p className="theme-kicker mt-0.5 text-[8px] text-muted-foreground">Followers</p>
        </div>
        <div>
          <p className="text-base font-bold text-foreground">{summary.counts.following}</p>
          <p className="theme-kicker mt-0.5 text-[8px] text-muted-foreground">Following</p>
        </div>
      </div>

      {summary.recentPosters.length > 0 ? (
        <div className="mt-4 border-t border-border/50 pt-4">
          <p className="theme-kicker mb-2 text-[8px] text-muted-foreground">Recently logged</p>
          <div className="flex gap-1.5">
            {summary.recentPosters.slice(0, 6).map((poster) =>
              poster.posterPath ? (
                <img
                  key={poster.tmdbId}
                  src={getPosterUrl(poster.posterPath)}
                  alt={`${poster.title} poster`}
                  loading="lazy"
                  className="h-12 w-8 flex-1 object-cover"
                />
              ) : (
                <span key={poster.tmdbId} className="h-12 w-8 flex-1 bg-muted/40" />
              ),
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
};
