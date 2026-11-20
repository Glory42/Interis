import { Link } from "@tanstack/react-router";
import { CalendarClock, Tv } from "lucide-react";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { Skeleton } from "@/components/ui/Skeleton";
import type { UpNextItem, UpNextResponse } from "@/features/tv/api";
import { useUpNext } from "@/features/tv/hooks/useTv";
import { AiringSoonList } from "./AiringSoonList";
import { UpNextRow } from "./UpNextRow";

const plural = (count: number, one: string, many = `${one}s`) => `${count} ${count === 1 ? one : many}`;

const RowList = ({ title, items }: { title: string; items: UpNextItem[] }) => (
  <section aria-label={title} className="flex flex-col gap-3">
    <h2 className="kicker text-muted-foreground">{title}</h2>
    <div className="flex flex-col gap-2">
      {items.map((item) => (
        <UpNextRow key={item.series.tmdbId} item={item} />
      ))}
    </div>
  </section>
);

const UpNextSkeleton = () => (
  <div className="flex flex-col gap-2" aria-hidden>
    {[0, 1, 2].map((index) => (
      <Skeleton key={index} className="h-28 w-full" />
    ))}
  </div>
);

// "3 shows in progress · 5 episodes in the next 14 days", the page's one-line overview.
const summaryOf = (data: UpNextResponse) => {
  const airing = data.airingSoon.reduce((sum, group) => sum + group.episodes.length, 0);
  return [
    data.upNext.length > 0 ? `${plural(data.upNext.length, "show")} in progress` : null,
    airing > 0 ? `${plural(airing, "episode")} in the next 14 days` : null,
  ]
    .filter(Boolean)
    .join(" · ");
};

// "What do I watch next?": your shows' next episodes beside a timeline of what airs soon.
export const UpNextPage = () => {
  const upNextQuery = useUpNext();
  const data = upNextQuery.data;
  const newItems = data?.upNext.filter((item) => item.newEpisodesCount > 0) ?? [];
  const otherItems = data?.upNext.filter((item) => item.newEpisodesCount === 0) ?? [];
  const summary = data ? summaryOf(data) : "";

  return (
    <main className="mx-auto w-full max-w-[1032px] px-4 pt-6 pb-24 md:pb-16">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <h1 className="display-1 text-foreground">Up next</h1>
          {summary ? <p className="mono-meta mt-1.5 uppercase text-muted-foreground">{summary}</p> : null}
        </div>
        <Link to="/serials" className="mono-meta uppercase text-muted-foreground hover:text-foreground" viewTransition>
          Browse TV →
        </Link>
      </header>

      {upNextQuery.isPending ? <UpNextSkeleton /> : null}
      {upNextQuery.isError ? (
        <ErrorState title="Couldn't load what's up next" onRetry={() => void upNextQuery.refetch()} />
      ) : null}

      {data ? (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
          <div className="flex flex-col gap-8">
            {data.upNext.length === 0 ? (
              <EmptyState
                icon={Tv}
                title="Nothing up next"
                description="Mark an episode watched on any show and its next one lands here."
              />
            ) : (
              <>
                {newItems.length > 0 ? <RowList title="New since you last watched" items={newItems} /> : null}
                {otherItems.length > 0 ? <RowList title="Continue watching" items={otherItems} /> : null}
              </>
            )}
          </div>

          <section
            aria-label="Airing soon"
            className="flex flex-col gap-4 rounded-[3px] border border-[color:var(--line)] p-4 lg:sticky lg:top-20"
          >
            <h2 className="kicker text-muted-foreground">Airing soon · next 14 days</h2>
            {data.airingSoon.length === 0 ? (
              <EmptyState
                icon={CalendarClock}
                title="Nothing airing soon"
                description="No new episodes from the shows you watch or watchlisted in the next two weeks."
              />
            ) : (
              <AiringSoonList airingSoon={data.airingSoon} today={data.today} />
            )}
          </section>
        </div>
      ) : null}
    </main>
  );
};
