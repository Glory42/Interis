import { View } from "react-native";
import { formatRatingLabel } from "@/lib/media";
import { useTheme } from "@/theme";
import { AppText, SectionHeader, Surface } from "@/components/ui";

type RatingBreakdownProps = {
  accentColor: string;
  averageRating: number | null;
  totalRated: number;
  buckets: { ratingValue: number; count: number; percentage: number }[];
  globalRating?: number | null;
};

export const RatingBreakdown = ({
  accentColor,
  averageRating,
  totalRated,
  buckets,
  globalRating,
}: RatingBreakdownProps) => {
  const { colors } = useTheme();
  const maxPercentage = Math.max(1, ...buckets.map((bucket) => bucket.percentage));
  const ordered = [...buckets].sort((a, b) => a.ratingValue - b.ratingValue);

  return (
    <Surface>
      <SectionHeader label="Ratings" color={accentColor} />
      <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 16 }}>
        <View>
          <AppText variant="display" size={30}>
            {formatRatingLabel(averageRating, { withSuffix: false }) ?? "–"}
          </AppText>
          <AppText size={11} tone="muted">
            {totalRated} rated
          </AppText>
          {globalRating ? (
            <AppText size={11} tone="faint" style={{ marginTop: 2 }}>
              TMDB {formatRatingLabel(globalRating)}
            </AppText>
          ) : null}
        </View>
        <View style={{ flex: 1, flexDirection: "row", alignItems: "flex-end", height: 56, gap: 3 }}>
          {ordered.map((bucket) => (
            <View
              key={bucket.ratingValue}
              style={{
                flex: 1,
                height: Math.max(3, (bucket.percentage / maxPercentage) * 56),
                borderRadius: 2,
                backgroundColor: bucket.count > 0 ? accentColor : colors.border,
                opacity: bucket.count > 0 ? 0.85 : 0.5,
              }}
            />
          ))}
        </View>
      </View>
    </Surface>
  );
};
