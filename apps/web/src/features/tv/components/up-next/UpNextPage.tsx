import { Link } from "@tanstack/react-router";
import { CalendarClock, Tv } from "lucide-react";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { Skeleton } from "@/components/ui/Skeleton";
import type { UpNextItem } from "@/features/tv/api";
import { useUpNext } from "@/features/tv/hooks/useTv";
import { AiringSoonList } from "./AiringSoonList";
import { UpNextCard } from "./UpNextCard";

const gridClass = "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3";

const CardGrid = ({ title, items }: { title: string; items: UpNextItem[] }) => (
  <section aria-label={title} className="flex flex-col gap-3">
    <h2 className="kicker text-muted-foreground">{title}</h2>
    <div className={gridClass}>
      {items.map((item) => (
        <UpNextCard key={item.series.tmdbId} item={item} />
      ))}
    </div>
  </section>
);

const UpNextSkeleton = () => (
  <div className={gridClass} aria-hidden>
    {[0, 1, 2].map((index) => (
      <Skeleton key={index} className="aspect-[4/3] w-full" />
    ))}
  </div>
);

// "What do I watch next?": the next episode of every show you're watching, then what airs soon.
export const UpNextPage = () => {
  const upNextQuery = useUpNext();
  const data = upNextQuery.data;
  const newItems = data?.upNext.filter((item) => item.newEpisodesCount > 0) ?? [];
  const otherItems = data?.upNext.filter((item) => item.newEpisodesCount === 0) ?? [];

  return (
    <main className="mx-auto w-full max-w-[1032px] px-4 pt-6 pb-24 md:pb-16">
      <header className="mb-6 flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="display-1 text-foreground">Up next</h1>
        <Link to="/serials" className="mono-meta uppercase text-muted-foreground hover:text-foreground" viewTransition>
          Browse TV →
        </Link>
      </header>

      {upNextQuery.isPending ? <UpNextSkeleton /> : null}
      {upNextQuery.isError ? (
        <ErrorState title="Couldn't load what's up next" onRetry={() => void upNextQuery.refetch()} />
      ) : null}

      {data ? (
        <div className="flex flex-col gap-10">
          {data.upNext.length === 0 ? (
            <EmptyState
              icon={Tv}
              title="Nothing up next"
              description="Mark an episode watched on any show and its next one lands here."
            />
          ) : (
            <>
              {newItems.length > 0 ? <CardGrid title="New since you last watched" items={newItems} /> : null}
              {otherItems.length > 0 ? <CardGrid title="Continue watching" items={otherItems} /> : null}
            </>
          )}

          <section aria-label="Airing soon" className="flex flex-col gap-3">
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
