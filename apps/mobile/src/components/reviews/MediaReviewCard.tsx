import { memo } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { formatRelativeTime } from "@/lib/time";
import type { MediaReview } from "@/types/movies";
import { AppText, Avatar, Surface } from "@/components/ui";
import { RocketRatingDisplay } from "@/components/media/RocketRating";
import { SpoilerGate } from "./SpoilerGate";
import { LikeButton } from "./LikeButton";

type MediaReviewCardProps = {
  review: MediaReview;
  accentColor: string;
  onToggleLike?: (review: MediaReview) => void;
};

export const MediaReviewCard = memo(function MediaReviewCard({
  review,
  accentColor,
  onToggleLike,
}: MediaReviewCardProps) {
  const router = useRouter();
  const authorName = review.author.displayUsername ?? review.author.username;
  const contextLabel = review.context
    ? review.context.episodeNumber
      ? `S${review.context.seasonNumber}E${review.context.episodeNumber}`
      : `Season ${review.context.seasonNumber}`
    : null;

  return (
    <Surface
      onPress={() =>
        router.push({
          pathname: "/review/[username]/[reviewId]",
          params: { username: review.author.username, reviewId: review.id },
        })
      }
    >
      <View style={{ flexDirection: "row", gap: 12 }}>
        <Avatar username={review.author.username} avatarUrl={review.author.avatarUrl} size={36} />
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "baseline", flexWrap: "wrap", gap: 6 }}>
            <AppText variant="display" size={15}>
              {authorName}
            </AppText>
            <AppText size={12} tone="muted">
              · {formatRelativeTime(review.createdAt)}
              {contextLabel ? ` · ${contextLabel}` : ""}
            </AppText>
          </View>
          {review.rating !== null ? (
            <View style={{ marginTop: 6 }}>
              <RocketRatingDisplay rating={review.rating} size={11} color={accentColor} />
            </View>
          ) : null}
          <SpoilerGate containsSpoilers={review.containsSpoilers} content={review.content} numberOfLines={6} />
          <View style={{ marginTop: 10 }}>
            <LikeButton
              count={review.likeCount}
              isLiked={review.viewerHasLiked}
              disabled={!onToggleLike}
              onPress={() => onToggleLike?.(review)}
            />
          </View>
        </View>
      </View>
    </Surface>
  );
});
