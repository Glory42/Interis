import { Link } from "@tanstack/react-router";
import { useUpNext } from "@/features/tv/hooks/useTv";
import { SERIES_MODULE_STYLES } from "@/features/media/styles";
import { UpNextCard } from "./UpNextCard";
import { UpNextRow } from "./UpNextRow";

const STRIP_LIMIT = 6;
// Up to this many shows read better as full-width rows than as a mostly empty card strip.
const ROWS_MAX = 2;

// Home's Up next: wide rows for one or two shows, swipeable cards beyond that, nothing when there's nothing to watch.
export const UpNextStrip = ({ enabled }: { enabled: boolean }) => {
  const upNextQuery = useUpNext(enabled);
  const items = upNextQuery.data?.upNext.slice(0, STRIP_LIMIT) ?? [];
  if (items.length === 0) return null;

  return (
    <section aria-label="Up next" className="mb-6">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h2 className="kicker" style={{ color: SERIES_MODULE_STYLES.accent }}>
          Up next
        </h2>
        <Link to="/serials/up-next" className="mono-meta uppercase text-muted-foreground hover:text-foreground" viewTransition>
          See all →
        </Link>
      </div>
      {items.length <= ROWS_MAX ? (
        <div className="grid gap-2">
          {items.map((item) => (
            <UpNextRow key={item.series.tmdbId} item={item} />
          ))}
        </div>
      ) : (
        <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] lg:mx-0 lg:px-0">
          {items.map((item) => (
            <UpNextCard key={item.series.tmdbId} item={item} compact className="w-60 shrink-0 snap-start sm:w-64" />
          ))}
        </div>
      )}
    </section>
  );
};
