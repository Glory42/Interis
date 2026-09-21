import type { MovieDetailResponse } from "@/features/films/api";
import { CINEMA_MODULE_STYLES } from "@/features/films/components/cinema-detail/styles";
import { RatingBreakdownChart } from "@/features/media-archive/components/RatingBreakdownChart";

type CinemaRatingBreakdownProps = {
  buckets: MovieDetailResponse["ratingBreakdown"]["buckets"];
};

export const CinemaRatingBreakdown = ({ buckets }: CinemaRatingBreakdownProps) => (
  <RatingBreakdownChart
    buckets={buckets}
    accentColor={CINEMA_MODULE_STYLES.accent}
    faintColor={CINEMA_MODULE_STYLES.faint}
  />
);
