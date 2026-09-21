import {
  Award,
  Clock3,
  DollarSign,
  Globe2,
  Languages,
} from "lucide-react";
import type { MovieDetailResponse } from "@/features/movies/api";
import { MOVIE_MODULE_STYLES } from "@/features/media/styles";
import type { MediaFactRow } from "@/features/media/detail/MediaFactsGrid";
import { MediaDetailsMainSection } from "@/features/media/detail/MediaDetailsMainSection";
import {
  formatMoneyLabel,
  toLanguageLabel,
} from "@/features/movies/components/movie-detail/utils";
import { formatRuntimeLabel } from "@/features/movies/components/utils";

type MovieDetailsMainSectionProps = {
  detail: MovieDetailResponse;
};

const buildFactRows = (
  detail: MovieDetailResponse,
  primaryDirectorName: string,
  runtimeLabel: string | null,
  languageLabel: string | null,
): MediaFactRow[] => {
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

export const MovieDetailsMainSection = ({
  detail,
}: MovieDetailsMainSectionProps) => {
  const movie = detail.movie;

  const primaryDirectorName =
    movie.directors[0]?.name ?? movie.director ?? "Unknown";

  const runtimeLabel = formatRuntimeLabel(movie.runtime);
  const languageLabel = toLanguageLabel(movie.languageCode);
  const communityRatingLabel =
    detail.ratingBreakdown.averageRating !== null
      ? detail.ratingBreakdown.averageRating.toFixed(1)
      : "--";
  const tmdbRatingLabel =
    movie.globalRating !== null ? movie.globalRating.toFixed(1) : "--";

  const factRows = buildFactRows(
    detail,
    primaryDirectorName,
    runtimeLabel,
    languageLabel,
  );

  return (
    <MediaDetailsMainSection
      moduleStyles={MOVIE_MODULE_STYLES}
      title={movie.title}
      yearLabel={movie.releaseYear ?? "Unknown"}
      genres={movie.genres}
      creditRoleLabel="dir. "
      creditPeople={movie.directors}
      creditFallbackName={movie.director ?? "Unknown"}
      communityRatingLabel={communityRatingLabel}
      logsCount={detail.logsCount}
      tmdbRatingLabel={tmdbRatingLabel}
      overview={movie.overview ?? ""}
      overviewFallback="No synopsis is available for this title."
      cast={movie.cast}
      factRows={factRows}
      ratingBuckets={detail.ratingBreakdown.buckets}
    />
  );
};
