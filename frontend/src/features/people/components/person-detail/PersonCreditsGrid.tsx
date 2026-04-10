import { Link } from "@tanstack/react-router";
import { Film, Tv } from "lucide-react";
import type { PersonCreditItem } from "@/features/people/api";
import { getPersonModuleStyles } from "@/features/people/components/styles";
import { roleTabLabelMap, type CreditRoleTab } from "./types";
import { getCreditPosterUrl } from "./helpers";

type PersonCreditsGridProps = {
  styles: ReturnType<typeof getPersonModuleStyles>;
  credits: PersonCreditItem[];
  roleTab: CreditRoleTab;
};

export const PersonCreditsGrid = ({
  styles,
  credits,
  roleTab,
}: PersonCreditsGridProps) => {
  if (credits.length === 0) {
    return (
      <div
        className="border p-4 font-mono text-xs"
        style={{
          borderColor: styles.border,
          background: styles.panel,
          color: styles.muted,
        }}
      >
        No {roleTabLabelMap[roleTab].toLowerCase()} credits available in this view.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {credits.map((credit) => {
        const roleLine = credit.character ?? credit.job ?? credit.department;

        return (
          <Link
            key={`${credit.mediaType}-${credit.tmdbId}-${credit.character ?? credit.job ?? "credit"}`}
            to={credit.mediaType === "movie" ? "/cinema/$tmdbId" : "/serials/$tmdbId"}
            params={{ tmdbId: String(credit.tmdbId) }}
            className="border p-3 transition-colors"
            style={{
              borderColor: styles.border,
              background: styles.panel,
            }}
            viewTransition
          >
            <div className="flex gap-3">
              <img
                src={getCreditPosterUrl(credit.posterPath)}
                alt={`${credit.title} poster`}
                className="h-20 w-14 shrink-0 object-cover"
              />

              <div className="min-w-0 flex-1">
                <p
                  className="truncate font-mono text-xs font-bold"
                  style={{ color: styles.text }}
                >
                  {credit.title}
                </p>
                <p className="font-mono text-[10px]" style={{ color: styles.faint }}>
                  {credit.releaseYear ?? "Year unknown"} ·{" "}
                  {credit.mediaType === "movie" ? (
                    <span className="inline-flex items-center gap-1">
                      <Film className="h-3 w-3" /> Cinema
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1">
                      <Tv className="h-3 w-3" /> Serial
                    </span>
                  )}
                </p>
                {roleLine ? (
                  <p
                    className="mt-1 line-clamp-2 font-mono text-[11px]"
                    style={{ color: styles.muted }}
                  >
                    {roleLine}
                  </p>
                ) : null}
                {credit.voteAverage !== null ? (
                  <p className="mt-1 font-mono text-[10px]" style={{ color: styles.faint }}>
                    TMDB {credit.voteAverage.toFixed(1)}
                    {credit.voteCount !== null
                      ? ` · ${credit.voteCount.toLocaleString()} votes`
                      : ""}
                  </p>
                ) : null}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
};
