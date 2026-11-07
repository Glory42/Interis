import { memo } from "react";
import { Link } from "@tanstack/react-router";
import { SentenceSelect } from "@/components/ui/SentenceSelect";
import type { PersonCreditItem, PersonDetailResponse } from "@/features/people/api";
import { getPosterUrl } from "@/features/movies/components/utils";
import { cn } from "@/lib/utils";
import { toCreditLine, toDecades } from "./filmography-model";
import type { CreditMediaTab, CreditRoleTab } from "./types";

type PersonFilmographyProps = {
  counts: PersonDetailResponse["credits"]["counts"];
  mediaTab: CreditMediaTab;
  roleTab: CreditRoleTab;
  onMediaTabChange: (tab: CreditMediaTab) => void;
  onRoleTabChange: (tab: CreditRoleTab) => void;
  credits: PersonCreditItem[];
  isLoading: boolean;
  hasMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
  now?: Date;
};

const CreditRow = memo(function CreditRow({ credit, now }: { credit: PersonCreditItem; now: Date }) {
  const line = toCreditLine(credit, now);
  return (
    <li>
      <Link
        to={credit.mediaType === "tv" ? "/serials/$tmdbId" : "/movies/$tmdbId"}
        params={{ tmdbId: String(credit.tmdbId) }}
        className="flex items-center gap-3 border-t border-[color:var(--line)] py-2 hover:bg-foreground/[0.03]"
        viewTransition
      >
        <span className="mono-meta w-10 shrink-0 text-muted-foreground">{credit.releaseYear ?? "—"}</span>
        {credit.posterPath ? (
          <img src={getPosterUrl(credit.posterPath)} alt="" className="aspect-2/3 w-8 shrink-0 rounded-[2px] object-cover" loading="lazy" />
        ) : (
          <span aria-hidden className="flex aspect-2/3 w-8 shrink-0 items-center justify-center overflow-hidden rounded-[2px] border border-[color:var(--line)] p-0.5 text-center text-[6px] leading-tight text-muted-foreground">
            {credit.title}
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-foreground">{credit.title}</span>
          <span className="body-s block truncate text-muted-foreground">{line.text}</span>
        </span>
        {line.badges.map((badge) => (
          <span key={badge} className="mono-meta shrink-0 rounded-[2px] border border-[color:var(--line)] px-1.5 py-0.5 uppercase text-muted-foreground">
            {badge}
          </span>
        ))}
      </Link>
    </li>
  );
});

// Crew or cast as tabs, a film/TV sentence, then one row per title grouped by decade.
export const PersonFilmography = ({
  counts,
  mediaTab,
  roleTab,
  onMediaTabChange,
  onRoleTabChange,
  credits,
  isLoading,
  hasMore,
  isLoadingMore,
  onLoadMore,
  now = new Date(),
}: PersonFilmographyProps) => {
  const roleCounts = counts[mediaTab];
  const total = (tab: CreditMediaTab) => counts[tab][roleTab];
  const mediaOptions = [
    { value: "combined", word: "films and TV", label: `Films and TV · ${total("combined")}` },
    { value: "movies", word: "films", label: `Films · ${total("movies")}` },
    { value: "tv", word: "TV", label: `TV · ${total("tv")}` },
  ] as const;

  return (
    <div>
      <div role="tablist" aria-label="Credits" className="flex gap-1 border-b border-[color:var(--line)]">
        {(["crew", "cast"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={roleTab === tab}
            onClick={() => onRoleTabChange(tab)}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-sm",
              roleTab === tab ? "border-[color:var(--primary)] text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tab === "crew" ? "Crew" : "Cast"} <small className="mono-meta text-muted-foreground">{roleCounts[tab]}</small>
          </button>
        ))}
      </div>

      <p className="body-s my-3 text-muted-foreground">
        {"Showing "}
        <SentenceSelect value={mediaTab} options={mediaOptions} onChange={onMediaTabChange} />
        {", newest first."}
      </p>

      {isLoading ? (
        <div className="h-40 animate-pulse rounded-[3px] bg-muted/20" />
      ) : credits.length === 0 ? (
        <p className="body-s border-t border-[color:var(--line)] pt-3 text-muted-foreground">No credits in this view.</p>
      ) : (
        toDecades(credits).map((decade) => (
          <section key={decade.label} role="group" aria-label={decade.label} className="mb-3">
            <p className="kicker mb-1 text-muted-foreground">{decade.label}</p>
            <ol>
              {decade.credits.map((credit) => (
                <CreditRow key={`${credit.mediaType}-${credit.tmdbId}`} credit={credit} now={now} />
              ))}
            </ol>
          </section>
        ))
      )}

      {hasMore ? (
        <button
          type="button"
          disabled={isLoadingMore}
          onClick={onLoadMore}
          className="mono-meta mt-3 rounded-[3px] border border-[color:var(--line)] px-4 py-2 uppercase text-muted-foreground hover:text-foreground disabled:opacity-60"
        >
          {isLoadingMore ? "Loading…" : "Load more credits"}
        </button>
      ) : null}
    </div>
  );
};
