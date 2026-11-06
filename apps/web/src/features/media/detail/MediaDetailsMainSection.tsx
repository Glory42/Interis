import { useState } from "react";
import type { PersonLink } from "@/features/people/shared";
import { PersonRouteLink } from "@/features/people/components/PersonRouteLink";
import { RatingBreakdownChart } from "@/features/media/detail/RatingBreakdownChart";
import type { MediaModuleStyles } from "@/features/media/styles";
import { CreditsList, type CreditRow } from "@/components/film/CreditsList";
import { formatCountLabel } from "@/lib/count-label";

// A fact with no value is left out rather than shown as "Unknown".
export type MediaFactRow = { label: string; value: string | null };

type CastMember = PersonLink & {
  tmdbPersonId: number;
  name: string;
  character?: string | null;
};

type RatingBucket = {
  ratingValue: number;
  count: number;
  percentage: number;
};

type MediaDetailsMainSectionProps = {
  moduleStyles: MediaModuleStyles;
  title: string;
  tagline: string | null;
  genres: { id: number; name: string }[];
  // "Directed by" / "Created by"; hidden when there's nobody to credit.
  creditRoleLabel: string;
  creditPeople: PersonLink[];
  communityRatingLabel: string;
  logsCount: number;
  tmdbRatingLabel: string;
  overview: string;
  overviewFallback: string;
  cast: CastMember[];
  factRows: MediaFactRow[];
  ratingBuckets: RatingBucket[];
};

const VISIBLE_CAST = 3;

// Opening-credit header (credit kicker, title, tagline, one score line) and a credits block.
export const MediaDetailsMainSection = ({
  moduleStyles,
  title,
  tagline,
  genres,
  creditRoleLabel,
  creditPeople,
  communityRatingLabel,
  logsCount,
  tmdbRatingLabel,
  overview,
  overviewFallback,
  cast,
  factRows,
  ratingBuckets,
}: MediaDetailsMainSectionProps) => {
  const [isCastExpanded, setIsCastExpanded] = useState(false);
  const visibleCast = isCastExpanded ? cast : cast.slice(0, VISIBLE_CAST);
  const hiddenCastCount = cast.length - VISIBLE_CAST;

  const creditRows: CreditRow[] = [
    ...visibleCast.map((member) => ({
      key: `cast-${member.tmdbPersonId}-${member.character ?? ""}`,
      label: member.character ?? "Cast",
      value: <PersonRouteLink person={member} className="hover:underline" />,
    })),
    ...factRows.map((fact) => ({ key: `fact-${fact.label}`, label: fact.label, value: fact.value })),
  ];

  return (
    <section className="md:pt-28">
      {creditPeople.length > 0 ? (
        <p className="kicker mb-1.5 text-muted-foreground">
          <span>{creditRoleLabel}</span>{" "}
          {creditPeople.map((person, personIndex) => (
            <span key={`detail-credit-${person.tmdbPersonId}-${personIndex}`}>
              <PersonRouteLink person={person} style={{ color: moduleStyles.accent }} />
              {personIndex < creditPeople.length - 1 ? ", " : null}
            </span>
          ))}
        </p>
      ) : null}

      <h1 className="display-1 text-foreground md:text-5xl">{title}</h1>
      {tagline ? <p className="tagline mt-2 text-lg text-muted-foreground">{tagline}</p> : null}

      <div className="mt-5 mb-6 flex flex-wrap items-baseline gap-x-6 gap-y-2 border-b border-[color:var(--line)] pb-5">
        <span className="flex items-baseline gap-1.5">
          <span className="mono-num" style={{ color: moduleStyles.accent }}>
            {communityRatingLabel}
          </span>
          <span className="mono-meta text-muted-foreground uppercase">
            Interis · {formatCountLabel(logsCount, "log")}
          </span>
        </span>
        <span className="flex items-baseline gap-1.5">
          <span className="mono-num text-muted-foreground">{tmdbRatingLabel}</span>
          <span className="mono-meta text-muted-foreground">TMDB</span>
        </span>
        {genres.length > 0 ? (
          <span className="mono-meta text-muted-foreground uppercase">
            {genres.slice(0, 3).map((genre) => genre.name).join(" / ")}
          </span>
        ) : null}
      </div>

      <p className="body mb-8 text-foreground">{overview || overviewFallback}</p>

      {creditRows.some((row) => row.value) ? (
        <div className="mb-8">
          <p className="kicker mb-2 text-muted-foreground">Credits</p>
          <CreditsList rows={creditRows} />
          {hiddenCastCount > 0 ? (
            <button
              type="button"
              onClick={() => setIsCastExpanded((current) => !current)}
              className="mono-meta mt-2 text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            >
              {isCastExpanded ? "Show less" : `+ ${hiddenCastCount} more cast`}
            </button>
          ) : null}
        </div>
      ) : null}

      <RatingBreakdownChart
        buckets={ratingBuckets}
        accentColor={moduleStyles.accent}
        faintColor={moduleStyles.faint}
      />
    </section>
  );
};
