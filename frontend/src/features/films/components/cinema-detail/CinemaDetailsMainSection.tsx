import {
  Award,
  Clock3,
  DollarSign,
  Globe2,
  Languages,
  type LucideIcon,
} from "lucide-react";
import type { MovieDetailResponse } from "@/features/films/api";
import { CINEMA_MODULE_STYLES } from "@/features/films/components/cinema-detail/styles";
import { PersonRouteLink } from "@/features/people/components/PersonRouteLink";
import {
  formatMoneyLabel,
  toLanguageLabel,
} from "@/features/films/components/cinema-detail/utils";
import { formatRuntimeLabel } from "@/features/films/components/utils";

type CinemaDetailsMainSectionProps = {
  detail: MovieDetailResponse;
};

type FactRow = {
  label: string;
  value: string;
  icon: LucideIcon;
};

const buildFactRows = (
  detail: MovieDetailResponse,
  primaryDirectorName: string,
  runtimeLabel: string | null,
  languageLabel: string | null,
): FactRow[] => {
  const movie = detail.movie;

  return [
    {
      label: "Director",
      value: primaryDirectorName,
      icon: Award,
    },
    {
      label: "Runtime",
      value: runtimeLabel ?? "Unknown",
      icon: Clock3,
    },
    {
      label: "Language",
      value: languageLabel ?? "Unknown",
      icon: Languages,
    },
    {
      label: "Country",
      value: movie.productionCountries[0] ?? "Unknown",
      icon: Globe2,
    },
    {
      label: "Budget",
      value: formatMoneyLabel(movie.budget),
      icon: DollarSign,
    },
    {
      label: "Box Office",
      value: formatMoneyLabel(movie.revenue),
      icon: DollarSign,
    },
  ];
};

export const CinemaDetailsMainSection = ({
  detail,
}: CinemaDetailsMainSectionProps) => {
  const movie = detail.movie;

  const primaryDirectorName =
    movie.directors[0]?.name ?? movie.director ?? "Unknown";

  const runtimeLabel = formatRuntimeLabel(movie.runtime);
  const languageLabel = toLanguageLabel(movie.languageCode);
  const communityRatingLabel =
    detail.ratingBreakdown.averageRatingOutOfFive !== null
      ? detail.ratingBreakdown.averageRatingOutOfFive.toFixed(1)
      : "--";
  const tmdbRatingLabel =
    movie.globalRatingOutOfTen !== null
      ? movie.globalRatingOutOfTen.toFixed(1)
      : "--";

  const factRows = buildFactRows(
    detail,
    primaryDirectorName,
    runtimeLabel,
    languageLabel,
  );

  return (
    <section>
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <span
          className="font-mono text-[10px]"
          style={{ color: CINEMA_MODULE_STYLES.faint }}
        >
          {movie.releaseYear ?? "Unknown"}
        </span>
        {movie.genres.slice(0, 3).map((genre) => (
          <span
            key={`detail-genre-${genre.id}`}
            className="border px-2 py-0.5 font-mono text-[9px]"
            style={{
              borderColor: CINEMA_MODULE_STYLES.border,
              color: CINEMA_MODULE_STYLES.muted,
            }}
          >
            {genre.name}
          </span>
        ))}
      </div>

      <h1
        className="mb-2 font-mono text-3xl font-bold leading-tight md:text-5xl"
        style={{ color: CINEMA_MODULE_STYLES.text }}
      >
        {movie.title}
      </h1>
      <p
        className="mb-6 font-mono text-sm"
        style={{ color: CINEMA_MODULE_STYLES.muted }}
      >
        <span>dir. </span>
        {movie.directors.length > 0 ? (
          movie.directors.map((director, directorIndex) => (
            <span
              key={`movie-director-${director.tmdbPersonId}-${directorIndex}`}
            >
              <PersonRouteLink
                person={director}
                className="font-mono"
                style={{ color: CINEMA_MODULE_STYLES.accent }}
              />
              {directorIndex < movie.directors.length - 1 ? (
                <span style={{ color: CINEMA_MODULE_STYLES.faint }}>, </span>
              ) : null}
            </span>
          ))
        ) : (
          <span style={{ color: CINEMA_MODULE_STYLES.accent }}>
            {movie.director ?? "Unknown"}
          </span>
        )}
      </p>

      <div
        className="mb-8 flex flex-wrap items-center gap-8 border-b pb-8"
        style={{ borderColor: CINEMA_MODULE_STYLES.borderSoft }}
      >
        <div>
          <p
            className="mb-1 font-mono text-[9px] uppercase tracking-[0.22em]"
            style={{ color: CINEMA_MODULE_STYLES.faint }}
          >
            Community
          </p>
          <div className="flex items-baseline gap-2">
            <span
              className="font-mono text-2xl font-bold"
              style={{ color: CINEMA_MODULE_STYLES.accent }}
            >
              {communityRatingLabel}
            </span>
            <span
              className="font-mono text-[10px]"
              style={{ color: CINEMA_MODULE_STYLES.faint }}
            >
              {detail.logsCount.toLocaleString()} logs
            </span>
          </div>
        </div>

        <div>
          <p
            className="mb-1 font-mono text-[9px] uppercase tracking-[0.22em]"
            style={{ color: CINEMA_MODULE_STYLES.faint }}
          >
            TMDB
          </p>
          <span
            className="font-mono text-2xl font-bold"
            style={{ color: CINEMA_MODULE_STYLES.muted }}
          >
            {tmdbRatingLabel}
          </span>
        </div>
      </div>

      <p className="mb-8 text-sm leading-relaxed">
        {movie.overview || "No synopsis is available for this title."}
      </p>

      <div
        className="mb-8 border-y py-5"
        style={{ borderColor: CINEMA_MODULE_STYLES.borderSoft }}
      >
        <p
          className="mb-3 font-mono text-[9px] uppercase tracking-[0.22em]"
          style={{ color: CINEMA_MODULE_STYLES.faint }}
        >
          Cast
        </p>

        {movie.cast.length === 0 ? (
          <p
            className="font-mono text-xs"
            style={{ color: CINEMA_MODULE_STYLES.muted }}
          >
            No cast metadata available.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {movie.cast.slice(0, 16).map((castMember) => (
              <PersonRouteLink
                key={`movie-cast-${castMember.tmdbPersonId}-${castMember.character ?? "cast"}`}
                person={castMember}
                className="border px-2 py-1 font-mono text-[10px]"
                style={{
                  borderColor: CINEMA_MODULE_STYLES.border,
                  color: CINEMA_MODULE_STYLES.muted,
                  background: CINEMA_MODULE_STYLES.panelSoft,
                }}
              >
                {castMember.character
                  ? `${castMember.name} as ${castMember.character}`
                  : castMember.name}
              </PersonRouteLink>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
        {factRows.map((fact) => (
          <div
            key={fact.label}
            className="flex items-start gap-3 border-b py-3"
            style={{ borderColor: CINEMA_MODULE_STYLES.borderSoft }}
          >
            <fact.icon
              className="mt-0.5 h-3.5 w-3.5 shrink-0"
              style={{ color: CINEMA_MODULE_STYLES.accent }}
            />
            <div className="min-w-0 flex-1">
              <p
                className="mb-0.5 font-mono text-[9px] uppercase tracking-[0.22em]"
                style={{ color: CINEMA_MODULE_STYLES.faint }}
              >
                {fact.label}
              </p>
              <p
                className="font-mono text-xs"
                style={{ color: CINEMA_MODULE_STYLES.text }}
              >
                {fact.value}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
