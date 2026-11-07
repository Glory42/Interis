import { Link } from "@tanstack/react-router";
import { CreditsList } from "@/components/film/CreditsList";
import { OutlinedRank } from "@/components/film/OutlinedRank";
import { toIsoWeek } from "@/features/media/archive/week-label";
import { getPosterUrl } from "@/features/movies/components/utils";
import type { MeFeedSummary, TrendingMovie } from "@/features/feed/types";
import type { TrendingSeries } from "@/features/serials/api";

type FeedRailProps = {
  films: TrendingMovie[];
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
        <div className="mt-2 h-40 animate-pulse rounded-[3px] bg-muted/25" />
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
