import { useState } from "react";
import type { ReactNode } from "react";
import type { PersonLink } from "@/features/people/shared";
import { PersonRouteLink } from "@/features/people/components/PersonRouteLink";
import { RatingBreakdownChart } from "@/features/media/detail/RatingBreakdownChart";
import { MediaFactsGrid, type MediaFactRow } from "@/features/media/detail/MediaFactsGrid";
import type { MediaModuleStyles } from "@/features/media/styles";

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
  yearLabel: ReactNode;
  genres: { id: number; name: string }[];
  creditRoleLabel: string;
  creditPeople: PersonLink[];
  creditFallbackName: string;
  communityRatingLabel: string;
  logsCount: number;
  tmdbRatingLabel: string;
  overview: string;
  overviewFallback: string;
  cast: CastMember[];
  factRows: MediaFactRow[];
  ratingBuckets: RatingBucket[];
};

export const MediaDetailsMainSection = ({
  moduleStyles,
  title,
  yearLabel,
  genres,
  creditRoleLabel,
  creditPeople,
  creditFallbackName,
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
  const visibleCast = isCastExpanded ? cast : cast.slice(0, 5);

  return (
    <section>
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <span className="font-mono text-[10px]" style={{ color: moduleStyles.faint }}>
          {yearLabel}
        </span>
        {genres.slice(0, 3).map((genre) => (
          <span
            key={`detail-genre-${genre.id}`}
            className="rounded-full border px-2 py-0.5 font-mono text-[9px]"
            style={{
              borderColor: moduleStyles.border,
              color: moduleStyles.muted,
            }}
          >
            {genre.name}
          </span>
        ))}
      </div>

      <h1
        className="mb-2 font-mono text-3xl font-bold leading-tight md:text-5xl"
        style={{ color: moduleStyles.text }}
      >
        {title}
      </h1>
      <p className="mb-6 font-mono text-sm" style={{ color: moduleStyles.muted }}>
        <span>{creditRoleLabel}</span>
        {creditPeople.length > 0 ? (
          creditPeople.map((person, personIndex) => (
            <span key={`detail-credit-${person.tmdbPersonId}-${personIndex}`}>
              <PersonRouteLink
                person={person}
                className="font-mono"
                style={{ color: moduleStyles.accent }}
              />
              {personIndex < creditPeople.length - 1 ? (
                <span style={{ color: moduleStyles.faint }}>, </span>
              ) : null}
            </span>
          ))
        ) : (
          <span style={{ color: moduleStyles.accent }}>{creditFallbackName}</span>
        )}
      </p>

      <div
        className="mb-8 flex flex-wrap items-center gap-8 border-b pb-8"
        style={{ borderColor: moduleStyles.borderSoft }}
      >
        <div>
          <p
            className="mb-1 font-mono text-[9px] uppercase tracking-[0.22em]"
            style={{ color: moduleStyles.faint }}
          >
            Community
          </p>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-2xl font-bold" style={{ color: moduleStyles.accent }}>
              {communityRatingLabel}
            </span>
            <span className="font-mono text-[10px]" style={{ color: moduleStyles.faint }}>
              {logsCount.toLocaleString()} logs
            </span>
          </div>
        </div>

        <div>
          <p
            className="mb-1 font-mono text-[9px] uppercase tracking-[0.22em]"
            style={{ color: moduleStyles.faint }}
          >
            TMDB
          </p>
          <span className="font-mono text-2xl font-bold" style={{ color: moduleStyles.muted }}>
            {tmdbRatingLabel}
          </span>
        </div>
      </div>

      <p className="mb-8 text-sm leading-relaxed">{overview || overviewFallback}</p>

      <div className="mb-8 border-y py-5" style={{ borderColor: moduleStyles.borderSoft }}>
        <p
          className="mb-3 font-mono text-[9px] uppercase tracking-[0.22em]"
          style={{ color: moduleStyles.faint }}
        >
          Cast
        </p>

        {cast.length === 0 ? (
          <p className="font-mono text-xs" style={{ color: moduleStyles.muted }}>
            No cast metadata available.
          </p>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {visibleCast.map((castMember) => (
                <PersonRouteLink
                  key={`detail-cast-${castMember.tmdbPersonId}-${castMember.character ?? "cast"}`}
                  person={castMember}
                  className="rounded-full border px-2 py-1 font-mono text-[10px]"
                  style={{
                    borderColor: moduleStyles.border,
                    color: moduleStyles.muted,
                    background: moduleStyles.panelSoft,
                  }}
                >
                  {castMember.character
                    ? `${castMember.name} as ${castMember.character}`
                    : castMember.name}
                </PersonRouteLink>
              ))}
            </div>

            {cast.length > 5 ? (
              <button
                type="button"
                className="mt-3 rounded-full border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors"
                style={{
                  borderColor: moduleStyles.border,
                  color: moduleStyles.muted,
                }}
                onClick={() => {
                  setIsCastExpanded((current) => !current);
                }}
              >
                {isCastExpanded ? "Show less" : `Show all (${cast.length})`}
              </button>
            ) : null}
          </>
        )}
      </div>

      <MediaFactsGrid factRows={factRows} moduleStyles={moduleStyles} />

      <RatingBreakdownChart
        buckets={ratingBuckets}
        accentColor={moduleStyles.accent}
        faintColor={moduleStyles.faint}
      />
    </section>
  );
};
