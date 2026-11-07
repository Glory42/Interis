import { LoadingRegion } from "@/components/ui/PageSkeletons";
import { Skeleton } from "@/components/ui/Skeleton";
import { Link } from "@tanstack/react-router";
import { CreditsList } from "@/components/film/CreditsList";
import { OutlinedRank } from "@/components/film/OutlinedRank";
import { toIsoWeek } from "@/features/media/archive/week-label";
import type { MeFeedSummary, TrendingFilm } from "@/features/feed/types";
import type { TrendingSeries } from "@/features/tv/api";
import { getPosterUrl } from "@/features/media/tmdb-images";

type FeedRailProps = {
  films: TrendingFilm[];
  shows: TrendingSeries[];
  week: MeFeedSummary["week"] | null;
  isLoading: boolean;
  now?: Date;
};

type RankedTitle = { tmdbId: number; title: string; posterPath: string | null };

const RankedList = ({ items, to }: { items: RankedTitle[]; to: "/movies/$tmdbId" | "/serials/$tmdbId" }) => (
  <ol className="mt-1.5">
    {items.map((item, index) => (
      <li key={item.tmdbId} className="border-b border-[color:var(--line)] last:border-b-0">
        <Link to={to} params={{ tmdbId: String(item.tmdbId) }} className="flex items-center gap-2.5 py-1.5 hover:text-foreground">
          <OutlinedRank value={index + 1} className="w-7 shrink-0 text-xl" />
          <img src={getPosterUrl(item.posterPath)} alt="" className="aspect-2/3 w-[22px] shrink-0 rounded-[1px] object-cover" loading="lazy" />
          <span className="body-s truncate text-foreground">{item.title}</span>
        </Link>
      </li>
    ))}
  </ol>
);

// Right rail: what's showing this week, ranked, and your own week in real numbers.
export const FeedRail = ({ films, shows, week, isLoading, now }: FeedRailProps) => (
  <div className="space-y-6">
    <section aria-label="Now showing">
      <p className="kicker text-[color:var(--film)]">{`Now showing · WK ${toIsoWeek(now ?? new Date())}`}</p>
      {isLoading ? (
        <LoadingRegion label="Loading now showing" className="mt-1.5">
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index} className="flex items-center gap-2.5 border-b border-[color:var(--line)] py-2 last:border-b-0">
              <Skeleton className="h-4 w-4 rounded-sm" />
              <Skeleton className="h-3 rounded-sm" style={{ width: `${55 + ((index * 13) % 30)}%` }} />
            </div>
          ))}
        </LoadingRegion>
      ) : (
        <>
          <RankedList items={films.slice(0, 5)} to="/movies/$tmdbId" />
          {shows.length > 0 ? (
            <>
              <p className="kicker mt-4 text-[color:var(--series)]">On TV</p>
              <RankedList items={shows.slice(0, 5)} to="/serials/$tmdbId" />
            </>
          ) : null}
        </>
      )}
    </section>

    {week ? (
      <section aria-label="Your week">
        <p className="kicker text-muted-foreground">Your week</p>
        <CreditsList
          className="mt-1"
          rows={[
            { label: "Logged", value: String(week.logs) },
            {
              label: "Avg rating",
              value: <span className="text-primary">{week.averageRating !== null ? week.averageRating.toFixed(1) : "—"}</span>,
            },
            { label: "Episodes", value: String(week.episodes) },
          ]}
        />
      </section>
    ) : null}
  </div>
);
