import type { FilmDetailResponse } from "@/features/films/api";
import { FILM_MODULE_STYLES } from "@/features/media/styles";
import {
  MediaDetailsMainSection,
  type MediaFactRow,
} from "@/features/media/detail/MediaDetailsMainSection";
import { formatMoneyLabel } from "@/features/films/components/film-detail/utils";
import type { ReactNode } from "react";
import { formatRuntimeLabel } from "@/features/films/components/utils";
import { getPosterUrl } from "@/features/media/tmdb-images";

type FilmDetailsMainSectionProps = {
  detail: FilmDetailResponse;
  actionsSlot?: ReactNode;
};

// Language and country sit on the hero slate; money rounds out the credits.
const buildFactRows = (detail: FilmDetailResponse): MediaFactRow[] => {
  const budget = formatMoneyLabel(detail.movie.budget);
  const boxOffice = formatMoneyLabel(detail.movie.revenue);

  return [
    {
      label: "Budget / Box office",
      value: budget || boxOffice ? `${budget ?? "—"} / ${boxOffice ?? "—"}` : null,
    },
  ];
};

export const FilmDetailsMainSection = ({ detail, actionsSlot }: FilmDetailsMainSectionProps) => {
  const movie = detail.movie;
  const communityRatingLabel =
    detail.ratingBreakdown.averageRating !== null
      ? detail.ratingBreakdown.averageRating.toFixed(1)
      : "--";
  const tmdbRatingLabel = movie.globalRating !== null ? movie.globalRating.toFixed(1) : "--";

  return (
    <MediaDetailsMainSection
      moduleStyles={FILM_MODULE_STYLES}
      title={movie.title}
      tagline={movie.tagline}
      genres={movie.genres}
      creditRoleLabel="Directed by"
      creditPeople={movie.directors}
      communityRatingLabel={communityRatingLabel}
      logsCount={detail.logsCount}
      tmdbRatingLabel={tmdbRatingLabel}
      overview={movie.overview ?? ""}
      overviewFallback="No synopsis is available for this title."
      cast={movie.cast}
      factRows={buildFactRows(detail)}
      ratingBuckets={detail.ratingBreakdown.buckets}
      posterUrl={movie.posterPath ? getPosterUrl(movie.posterPath) : null}
      runtimeLabel={formatRuntimeLabel(movie.runtime)}
      actionsSlot={actionsSlot}
    />
  );
};
