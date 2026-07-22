import { Link } from "@tanstack/react-router";
import { PlayCircle } from "lucide-react";
import { getPosterUrl } from "@/features/serials/components/utils";
import { ProfileTabEmptyState } from "@/features/profile/components/ProfileTabEmptyState";
import {
  PROFILE_MEDIA_GRID_CLASSES,
  ProfileMediaGridSkeleton,
} from "@/features/profile/components/ProfileMediaGridSkeleton";
import { useUserCurrentlyWatching } from "@/features/profile/hooks/useProfile";
import { getRelativeTime } from "@/features/profile/utils/profile.utils";

type ProfileWatchingPageProps = {
  username: string;
};

export const ProfileWatchingPage = ({ username }: ProfileWatchingPageProps) => {
  const currentlyWatchingQuery = useUserCurrentlyWatching(username);
  const items = currentlyWatchingQuery.data ?? [];

  return (
    <>
      {currentlyWatchingQuery.isPending ? <ProfileMediaGridSkeleton /> : null}

      {currentlyWatchingQuery.isError ? (
        <div className="border border-border/60 bg-card/30 p-4 text-sm text-destructive">
          Could not load currently watching.
        </div>
      ) : null}

      {!currentlyWatchingQuery.isPending &&
      !currentlyWatchingQuery.isError &&
      items.length === 0 ? (
        <ProfileTabEmptyState
          icon={PlayCircle}
          title="Nothing in progress"
          description="This profile has not started a serial they haven't finished yet."
          cta={{ label: "Browse Serials", to: "/serials" }}
        />
      ) : null}

      {!currentlyWatchingQuery.isPending &&
      !currentlyWatchingQuery.isError &&
      items.length > 0 ? (
        <div>
          <h3 className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
            Watching
          </h3>

          <div className={PROFILE_MEDIA_GRID_CLASSES}>
            {items.map((item) => (
              <Link
                key={`watching-${item.tmdbId}`}
                to="/serials/$tmdbId"
                params={{ tmdbId: String(item.tmdbId) }}
                className="group block border border-border/70 bg-card/25 transition-colors hover:border-border"
                viewTransition
              >
                <div className="aspect-2/3 overflow-hidden border-b border-border/70">
                  <img
                    src={getPosterUrl(item.posterPath)}
                    alt={item.title}
                    className="h-full w-full object-cover opacity-90 transition-all duration-500 group-hover:scale-105 group-hover:opacity-100"
                    loading="lazy"
                  />
                </div>

                <div className="p-2">
                  <p className="line-clamp-1 text-[11px] font-semibold text-foreground/95 transition-colors group-hover:text-primary">
                    {item.title}
                  </p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground/85">
                    {item.watchedEpisodesCount} / {item.numberOfEpisodes ?? "?"} episodes
                  </p>

                  <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-border/50">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${Math.min(100, Math.max(0, item.progressPercent))}%` }}
                    />
                  </div>

                  {item.currentEpisode ? (
                    <p className="mt-1.5 line-clamp-1 text-[10px] font-medium text-primary">
                      Up next: S{item.currentEpisode.seasonNumber}E
                      {item.currentEpisode.episodeNumber}
                    </p>
                  ) : null}

                  <p className="mt-0.5 text-[10px] text-muted-foreground/70">
                    Watched {getRelativeTime(item.lastWatchedAt)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
};
