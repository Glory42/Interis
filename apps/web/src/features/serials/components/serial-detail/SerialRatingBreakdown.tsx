import type { SerialDetailResponse } from "@/features/serials/api";
import { SERIAL_MODULE_STYLES } from "@/features/serials/components/serial-detail/styles";
import { RatingBreakdownChart } from "@/features/media-archive/components/RatingBreakdownChart";

type SerialRatingBreakdownProps = {
  buckets: SerialDetailResponse["ratingBreakdown"]["buckets"];
};

export const SerialRatingBreakdown = ({ buckets }: SerialRatingBreakdownProps) => (
  <RatingBreakdownChart
    buckets={buckets}
    accentColor={SERIAL_MODULE_STYLES.accent}
    faintColor={SERIAL_MODULE_STYLES.faint}
  />
);
