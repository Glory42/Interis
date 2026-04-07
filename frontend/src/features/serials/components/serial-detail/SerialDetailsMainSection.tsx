import type { SerialDetailResponse } from "@/features/serials/api";
import { buildSerialFactRows } from "@/features/serials/components/serial-detail/facts";
import { SerialFactsGrid } from "@/features/serials/components/serial-detail/SerialFactsGrid";
import { SerialRatingBreakdown } from "@/features/serials/components/serial-detail/SerialRatingBreakdown";
import { SERIAL_MODULE_STYLES } from "@/features/serials/components/serial-detail/styles";
import { toDateLabel } from "@/features/serials/components/serial-detail/utils";
import { PersonRouteLink } from "@/features/people/components/PersonRouteLink";
import {
  formatEpisodeRuntimeLabel,
  toLanguageLabel,
} from "@/features/serials/components/utils";

type SerialDetailsMainSectionProps = {
  detail: SerialDetailResponse;
};

export const SerialDetailsMainSection = ({
  detail,
}: SerialDetailsMainSectionProps) => {
  const series = detail.series;

  const runtimeLabel = formatEpisodeRuntimeLabel(series.episodeRuntime);
  const languageLabel = toLanguageLabel(series.languageCode);
  const firstAirDateLabel = toDateLabel(series.firstAirDate);
  const lastAirDateLabel = toDateLabel(series.lastAirDate);

  const communityRatingLabel =
    detail.ratingBreakdown.averageRatingOutOfFive !== null
      ? detail.ratingBreakdown.averageRatingOutOfFive.toFixed(1)
      : "--";

  const tmdbRatingLabel =
    series.globalRatingOutOfTen !== null
      ? series.globalRatingOutOfTen.toFixed(1)
      : "--";

  const factRows = buildSerialFactRows(
    detail,
    runtimeLabel,
    languageLabel,
    firstAirDateLabel,
    lastAirDateLabel,
  );

  return (
    <section>
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <span
          className="font-mono text-[10px]"
          style={{ color: SERIAL_MODULE_STYLES.faint }}
        >
          {series.firstAirYear ?? "Unknown"}
        </span>
        {series.genres.slice(0, 3).map((genre) => (
          <span
            key={`serial-detail-genre-${genre.id}`}
            className="border px-2 py-0.5 font-mono text-[9px]"
            style={{
              borderColor: SERIAL_MODULE_STYLES.border,
              color: SERIAL_MODULE_STYLES.muted,
            }}
          >
            {genre.name}
          </span>
        ))}
      </div>

      <h1
        className="mb-2 font-mono text-3xl font-bold leading-tight md:text-5xl"
        style={{ color: SERIAL_MODULE_STYLES.text }}
      >
        {series.title}
      </h1>
      <p
        className="mb-6 font-mono text-sm"
        style={{ color: SERIAL_MODULE_STYLES.muted }}
      >
        <span>created by </span>
        {series.creators.length > 0 ? (
          series.creators.map((creator, creatorIndex) => (
            <span
              key={`series-creator-${creator.tmdbPersonId}-${creatorIndex}`}
            >
              <PersonRouteLink
                person={creator}
                className="font-mono"
                style={{ color: SERIAL_MODULE_STYLES.accent }}
              />
              {creatorIndex < series.creators.length - 1 ? (
                <span style={{ color: SERIAL_MODULE_STYLES.faint }}>, </span>
              ) : null}
            </span>
          ))
        ) : (
          <span style={{ color: SERIAL_MODULE_STYLES.accent }}>
            {series.creator ?? "Unknown"}
          </span>
        )}
      </p>

      <div
        className="mb-8 flex flex-wrap items-center gap-8 border-b pb-8"
        style={{ borderColor: SERIAL_MODULE_STYLES.borderSoft }}
      >
        <div>
          <p
            className="mb-1 font-mono text-[9px] uppercase tracking-[0.22em]"
            style={{ color: SERIAL_MODULE_STYLES.faint }}
          >
            Community
          </p>
          <div className="flex items-baseline gap-2">
            <span
              className="font-mono text-2xl font-bold"
              style={{ color: SERIAL_MODULE_STYLES.accent }}
            >
              {communityRatingLabel}
            </span>
            <span
              className="font-mono text-[10px]"
              style={{ color: SERIAL_MODULE_STYLES.faint }}
            >
              {detail.logsCount.toLocaleString()} logs
            </span>
          </div>
        </div>

        <div>
          <p
            className="mb-1 font-mono text-[9px] uppercase tracking-[0.22em]"
            style={{ color: SERIAL_MODULE_STYLES.faint }}
          >
            TMDB
          </p>
          <span
            className="font-mono text-2xl font-bold"
            style={{ color: SERIAL_MODULE_STYLES.muted }}
          >
            {tmdbRatingLabel}
          </span>
        </div>
      </div>

      <p className="mb-8 text-sm leading-relaxed">
        {series.overview || "No synopsis is available for this series."}
      </p>

      <div
        className="mb-8 border-y py-5"
        style={{ borderColor: SERIAL_MODULE_STYLES.borderSoft }}
      >
        <p
          className="mb-3 font-mono text-[9px] uppercase tracking-[0.22em]"
          style={{ color: SERIAL_MODULE_STYLES.faint }}
        >
          Cast
        </p>

        {series.cast.length === 0 ? (
          <p
            className="font-mono text-xs"
            style={{ color: SERIAL_MODULE_STYLES.muted }}
          >
            No cast metadata available.
          </p>
        ) : (
          <div className="mb-4 flex flex-wrap gap-2">
            {series.cast.slice(0, 18).map((castMember) => (
              <PersonRouteLink
                key={`series-cast-${castMember.tmdbPersonId}-${castMember.character ?? "cast"}`}
                person={castMember}
                className="border px-2 py-1 font-mono text-[10px]"
                style={{
                  borderColor: SERIAL_MODULE_STYLES.border,
                  color: SERIAL_MODULE_STYLES.muted,
                  background: SERIAL_MODULE_STYLES.panelSoft,
                }}
              >
                {castMember.character
                  ? `${castMember.name} as ${castMember.character}`
                  : castMember.name}
              </PersonRouteLink>
            ))}
          </div>
        )}

        <p
          className="mb-3 font-mono text-[9px] uppercase tracking-[0.22em]"
          style={{ color: SERIAL_MODULE_STYLES.faint }}
        >
          Creators & Crew
        </p>

        {series.creators.length === 0 && series.crew.length === 0 ? (
          <p
            className="font-mono text-xs"
            style={{ color: SERIAL_MODULE_STYLES.muted }}
          >
            No creator or crew metadata available.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {[...series.creators, ...series.crew]
              .slice(0, 18)
              .map((crewMember) => (
                <PersonRouteLink
                  key={`series-crew-${crewMember.tmdbPersonId}-${crewMember.job ?? "crew"}`}
                  person={crewMember}
                  className="border px-2 py-1 font-mono text-[10px]"
                  style={{
                    borderColor: SERIAL_MODULE_STYLES.border,
                    color: SERIAL_MODULE_STYLES.muted,
                    background: SERIAL_MODULE_STYLES.panelSoft,
                  }}
                >
                  {crewMember.job
                    ? `${crewMember.name} — ${crewMember.job}`
                    : crewMember.name}
                </PersonRouteLink>
              ))}
          </div>
        )}
      </div>

      <SerialFactsGrid factRows={factRows} />

      <SerialRatingBreakdown buckets={detail.ratingBreakdown.buckets} />
    </section>
  );
};
