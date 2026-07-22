import { Link } from "@tanstack/react-router";
import { Film, Tv } from "lucide-react";
import { useState } from "react";
import { getPosterUrl } from "@/features/films/components/utils";
import { getRelativeTime } from "@/features/profile/utils/profile.utils";
import type { ProfileRecentActivityItem } from "./profileOverview.utils";

type ProfileRecentActivitySectionProps = {
  activities: ProfileRecentActivityItem[];
  isPending: boolean;
  isError: boolean;
};

const formatActionLabel = (action: ProfileRecentActivityItem["actionLabel"]): string => {
  return action.toLowerCase();
};

const ActivityThumbnail = ({ item }: { item: ProfileRecentActivityItem }) => {
  const [didPosterFail, setDidPosterFail] = useState(false);
  const isSerial = item.mediaType === "tv";
  const accentColor = isSerial ? "var(--module-serial)" : "var(--module-cinema)";
  const Icon = isSerial ? Tv : Film;
  const posterUrl = item.posterPath ? getPosterUrl(item.posterPath) : null;
  const showPoster = Boolean(posterUrl && !didPosterFail);

  return (
    <div
      className="h-10 w-7 shrink-0 overflow-hidden border"
      style={{
        borderColor: `color-mix(in srgb, ${accentColor} 30%, transparent)`,
        background: "color-mix(in srgb, var(--profile-shell-bg) 85%, black)",
      }}
    >
      {showPoster ? (
        <img
          src={posterUrl ?? undefined}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setDidPosterFail(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <Icon className="h-3 w-3" style={{ color: accentColor, opacity: 0.5 }} aria-hidden="true" />
        </div>
      )}
    </div>
  );
};

export const ProfileRecentActivitySection = ({
  activities,
  isPending,
  isError,
}: ProfileRecentActivitySectionProps) => {
  return (
    <section>
      <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.16em] profile-shell-accent">
        Recent Activity
      </p>

      <div className="space-y-0">
        {isPending && activities.length === 0 ? (
          <div className="border-b py-3 font-mono text-xs profile-shell-row-border profile-shell-muted">
            Loading recent activity...
          </div>
        ) : null}

        {isError && activities.length === 0 ? (
          <div className="border-b py-3 font-mono text-xs text-destructive profile-shell-row-border">
            Could not load recent activity.
          </div>
        ) : null}

        {!isPending && !isError && activities.length === 0 ? (
          <div className="border-b py-3 font-mono text-xs profile-shell-row-border profile-shell-muted">
            No recent activity yet.
          </div>
        ) : null}

        {activities.map((item) => {
          const isSerial = item.mediaType === "tv";
          const accentColor = isSerial
            ? "var(--module-serial)"
            : "var(--module-cinema)";
          const mediaLabel = isSerial ? "Serial" : "Cinema";

          const rowInner = (
            <>
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: accentColor }}
                aria-hidden="true"
              />

              <ActivityThumbnail item={item} />

              <div className="min-w-0 flex-1">
                <span className="font-mono text-xs profile-shell-muted">
                  {formatActionLabel(item.actionLabel)}{" "}
                </span>
                <span className="font-mono text-xs font-bold text-foreground">
                  {item.mediaTitle}
                </span>
                {item.ratingLabel ? (
                  <span className="font-mono text-xs profile-shell-muted">
                    {" "}
                    · {item.ratingLabel}
                  </span>
                ) : null}
              </div>

              <span
                className="shrink-0 border px-1.5 py-0.5 font-mono text-[9px]"
                style={{
                  borderColor: `color-mix(in srgb, ${accentColor} 25%, transparent)`,
                  color: accentColor,
                }}
              >
                {mediaLabel}
              </span>

              <span className="shrink-0 font-mono text-[10px] profile-shell-muted">
                {getRelativeTime(item.createdAt)}
              </span>
            </>
          );

          return isSerial ? (
            <Link
              key={item.id}
              to="/serials/$tmdbId"
              params={{ tmdbId: String(item.tmdbId) }}
              className="flex items-center gap-4 border-b py-3 transition-colors hover:bg-background/25 profile-shell-row-border"
              viewTransition
            >
              {rowInner}
            </Link>
          ) : (
            <Link
              key={item.id}
              to="/cinema/$tmdbId"
              params={{ tmdbId: String(item.tmdbId) }}
              className="flex items-center gap-4 border-b py-3 transition-colors hover:bg-background/25 profile-shell-row-border"
              viewTransition
            >
              {rowInner}
            </Link>
          );
        })}
      </div>
    </section>
  );
};
