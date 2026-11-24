import { View } from "react-native";
import { useTheme } from "@/theme";
import type { Genre, ReviewSort } from "@/types/common";
import type { MediaReview } from "@/types/movies";
import { AppText, Button, ChipRow, EmptyView, SectionHeader, Surface } from "@/components/ui";
import { MediaReviewCard } from "@/components/reviews/MediaReviewCard";
import { RocketRatingInput } from "./RocketRating";
import { formatRatingLabel } from "@/lib/media";

export const GenrePills = ({ genres, accentColor }: { genres: Genre[]; accentColor: string }) => {
  const { colors } = useTheme();
  if (genres.length === 0) return null;

  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
      {genres.map((genre) => (
        <View
          key={genre.id}
          style={{
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: colors.surfaceBorder,
          }}
        >
          <AppText variant="mono" size={10} color={accentColor}>
            {genre.name}
          </AppText>
        </View>
      ))}
    </View>
  );
};

export const StatStrip = ({ stats }: { stats: { label: string; value: string | number }[] }) => {
  const { colors } = useTheme();

  return (
    <View
      style={{
        flexDirection: "row",
        paddingVertical: 12,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: colors.rowBorder,
      }}
    >
      {stats.map((stat) => (
        <View key={stat.label} style={{ flex: 1, alignItems: "center" }}>
          <AppText variant="display" size={18}>
            {stat.value}
          </AppText>
          <AppText variant="kicker" size={8} tone="muted">
            {stat.label}
          </AppText>
        </View>
      ))}
    </View>
  );
};

type ViewerRatingPanelProps = {
  accentColor: string;
  rating: number | null;
  disabled: boolean;
  onChange: (rating: number | null) => void;
  onLog: () => void;
};

export const ViewerRatingPanel = ({ accentColor, rating, disabled, onChange, onLog }: ViewerRatingPanelProps) => (
  <Surface>
    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
      <SectionHeader label="Your rating" color={accentColor} />
      <AppText variant="mono" size={12} color={accentColor}>
        {formatRatingLabel(rating) ?? "—"}
      </AppText>
    </View>
    <RocketRatingInput value={rating} onChange={onChange} color={accentColor} disabled={disabled} size={25} />
    <Button label="Log or review" onPress={onLog} style={{ marginTop: 16 }} fullWidth />
  </Surface>
);

export const GuestPrompt = ({ onSignIn }: { onSignIn: () => void }) => (
  <Surface>
    <AppText tone="muted" size={14}>
      Sign in to rate, log and keep a watchlist.
    </AppText>
    <Button label="Sign in" variant="outline" size="sm" onPress={onSignIn} style={{ marginTop: 12, alignSelf: "flex-start" }} />
  </Surface>
);

type ReviewsSectionProps = {
  accentColor: string;
  reviews: MediaReview[];
  totalCount: number;
  sort: ReviewSort;
  onSortChange: (sort: ReviewSort) => void;
  onToggleLike?: (review: MediaReview) => void;
};

export const ReviewsSection = ({
  accentColor,
  reviews,
  totalCount,
  sort,
  onSortChange,
  onToggleLike,
}: ReviewsSectionProps) => (
  <View style={{ gap: 12 }}>
    <View style={{ paddingHorizontal: 16 }}>
      <SectionHeader label={`Reviews · ${totalCount}`} color={accentColor} />
    </View>
    <ChipRow
      options={[
        { value: "popular", label: "Popular" },
        { value: "recent", label: "Recent" },
      ]}
      value={sort}
      onChange={onSortChange}
      accentColor={accentColor}
    />
    <View style={{ paddingHorizontal: 16, gap: 12 }}>
      {reviews.length === 0 ? (
        <EmptyView title="No reviews yet" message="Be the first to share what you thought." />
      ) : (
        reviews.map((review) => (
          <MediaReviewCard key={review.id} review={review} accentColor={accentColor} onToggleLike={onToggleLike} />
        ))
      )}
    </View>
  </View>
);
