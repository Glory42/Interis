import type { CSSProperties } from "react";
import { Link } from "@tanstack/react-router";
import type { FeedItem, MeFeedSummary } from "@/features/feed/types";
import type { MeProfile } from "@/types/api";

type MyProfileSummaryRailProps = {
  user: MeProfile | null;
  isLoading: boolean;
  isError: boolean;
  summary: MeFeedSummary | null;
  feedItems: FeedItem[];
};

type LoggedThing = {
  id: string;
  title: string;
  to: "/cinema/$tmdbId" | "/serials/$tmdbId";
  tmdbId: number;
  module: "CINEMA" | "SERIAL";
  count: number;
};

const buildTopLoggedThings = (items: FeedItem[]): LoggedThing[] => {
  const counts = new Map<string, LoggedThing>();

  for (const item of items) {
    if (!item.movie) {
      continue;
    }

    const key = `${item.movie.mediaType}:${item.movie.tmdbId}`;
    const existing = counts.get(key);
    if (existing) {
      existing.count += 1;
      continue;
    }

    counts.set(key, {
      id: key,
      title: item.movie.title,
      to:
        item.movie.mediaType === "tv"
          ? "/serials/$tmdbId"
          : "/cinema/$tmdbId",
      tmdbId: item.movie.tmdbId,
      module: item.movie.mediaType === "tv" ? "SERIAL" : "CINEMA",
      count: 1,
    });
  }

  return Array.from(counts.values())
    .sort((left, right) => right.count - left.count)
    .slice(0, 6);
};

export const MyProfileSummaryRail = ({
  feedItems,
}: MyProfileSummaryRailProps) => {
  const topLoggedThings = buildTopLoggedThings(feedItems);

  return (
    <section className="border border-border/70 p-5">
      <p className="mb-4 font-mono text-[9px] uppercase tracking-[0.16em] text-(--module-serial)">
        // TRENDING_AMONG_USERS
      </p>

      {topLoggedThings.length > 0 ? (
        <div className="space-y-3">
          {topLoggedThings.map((entry, index) => {
            const moduleColor =
              entry.module === "CINEMA"
                ? "var(--module-cinema)"
                : "var(--module-serial)";
            const moduleStyle = {
              borderColor: `color-mix(in srgb, ${moduleColor} 42%, transparent)`,
              color: moduleColor,
            } satisfies CSSProperties;

            return (
              <div key={entry.id} className="flex items-center gap-3">
                <span className="w-4 font-mono text-[10px] text-muted-foreground">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <Link
                    to={entry.to}
                    params={{ tmdbId: String(entry.tmdbId) }}
                    className="block truncate font-mono text-xs text-foreground/80 hover:text-foreground"
                    viewTransition
                  >
                    {entry.title}
                  </Link>
                </div>
                <span
                  className="border px-1.5 py-0.5 font-mono text-[9px] tracking-[0.08em]"
                  style={moduleStyle}
                >
                  {entry.module}
                </span>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {entry.count}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="font-mono text-[11px] text-muted-foreground">
          not enough logs yet to calculate trends.
        </p>
      )}
    </section>
  );
};
