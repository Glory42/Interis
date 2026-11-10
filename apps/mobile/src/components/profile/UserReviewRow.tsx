import { memo } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { formatRelativeTime } from "@/lib/time";
import { useTheme } from "@/theme";
import type { UserReview } from "@/types/profile";
import { AppText, Surface } from "@/components/ui";
import { Poster } from "@/components/media/Poster";
import { RocketRatingDisplay } from "@/components/media/RocketRating";
import { SpoilerGate } from "@/components/reviews/SpoilerGate";

export const UserReviewRow = memo(function UserReviewRow({
  review,
  username,
}: {
  review: UserReview;
  username: string;
}) {
  const router = useRouter();
  const { colors } = useTheme();
  const accent = review.mediaType === "tv" ? colors.serial : colors.movie;

  return (
    <Surface
      accentColor={accent}
      onPress={() =>
        router.push({ pathname: "/review/[username]/[reviewId]", params: { username, reviewId: review.id } })
      }
    >
      <View style={{ flexDirection: "row", gap: 12 }}>
        <Poster posterPath={review.posterPath} width={56} size="w185" accentColor={accent} />
        <View style={{ flex: 1 }}>
          <AppText variant="display" size={16} numberOfLines={1}>
            {review.title}
            {review.releaseYear ? (
              <AppText size={12} tone="muted">{`  ${review.releaseYear}`}</AppText>
            ) : null}
          </AppText>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 }}>
            {review.rating != null ? <RocketRatingDisplay rating={review.rating} size={10} color={accent} /> : null}
            <AppText size={11} tone="muted">
              {formatRelativeTime(review.createdAt, { maxUnit: "year" })}
            </AppText>
          </View>
          <SpoilerGate containsSpoilers={review.containsSpoilers} content={review.content} numberOfLines={4} />
        </View>
      </View>
    </Surface>
  );
});
