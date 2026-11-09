import { memo } from "react";
import { Link } from "@tanstack/react-router";
import { OutlinedRank } from "@/components/film/OutlinedRank";
import { RocketDisplay } from "@/components/film/rating/RocketDisplay";
import type { ListDetail } from "@/features/lists/api";
import { getPosterUrl } from "@/features/media/tmdb-images";

type ListItem = ListDetail["items"][number];

const MISSING_TITLE = "Title no longer available";

const routeFor = (item: ListItem) => (item.itemType === "movie" ? "/movies/$tmdbId" : "/serials/$tmdbId");

const TitleLink = ({ item, className, children }: { item: ListItem; className?: string; children: React.ReactNode }) =>
  item.tmdbId !== null ? (
    <Link to={routeFor(item)} params={{ tmdbId: String(item.tmdbId) }} className={className} viewTransition>
      {children}
    </Link>
  ) : (
    <span className={className}>{children}</span>
  );

// One ranked row: number, poster, title with year and credit, the owner's note and score.
export const ListDetailRow = memo(function ListDetailRow({ item, rank }: { item: ListItem; rank: number | null }) {
  const credit = [item.releaseYear, item.credit].filter(Boolean).join(" · ");
  return (
    <li aria-label={item.title ?? MISSING_TITLE} className="flex items-center gap-3.5 border-t border-[color:var(--line)] py-2.5">
      {rank !== null ? <OutlinedRank value={rank} className="w-9 shrink-0" /> : null}
      <TitleLink item={item} className="w-[34px] shrink-0">
        <img src={getPosterUrl(item.posterPath)} alt="" className="aspect-2/3 w-full rounded-[2px] object-cover" loading="lazy" />
      </TitleLink>
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-baseline gap-x-1.5">
          <TitleLink item={item} className={item.title ? "font-semibold text-foreground hover:underline" : "text-muted-foreground"}>
            {item.title ?? MISSING_TITLE}
          </TitleLink>
          {credit ? <span className="mono-meta uppercase text-muted-foreground">{credit}</span> : null}
        </p>
        {item.note ? <p className="user-text tagline text-muted-foreground">{`“${item.note}”`}</p> : null}
      </div>
      {item.ownerRating !== null ? <RocketDisplay rating={item.ownerRating} size="sm" /> : null}
    </li>
  );
});

export const ListDetailPoster = memo(function ListDetailPoster({ item, rank }: { item: ListItem; rank: number | null }) {
  return (
    <TitleLink item={item} className="group block">
      <div className="relative mb-1.5 aspect-2/3 overflow-hidden rounded-[2px] border border-[color:var(--line)]">
        <img src={getPosterUrl(item.posterPath)} alt="" className="size-full object-cover" loading="lazy" />
        {rank !== null ? <OutlinedRank value={rank} className="absolute top-1 left-1.5 text-xl" /> : null}
      </div>
      <p className="line-clamp-1 text-[11px] font-semibold text-foreground">{item.title ?? MISSING_TITLE}</p>
      {item.releaseYear ? <p className="mono-meta text-[10px] text-muted-foreground">{item.releaseYear}</p> : null}
    </TitleLink>
  );
});
