import { memo } from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import { mediaHref } from "@/lib/media";
import { useTheme } from "@/theme";
import type { FeedItem } from "@/types/feed";
import { AppText, Surface } from "@/components/ui";
import { Poster } from "@/components/media/Poster";
import { RocketRatingDisplay } from "@/components/media/RocketRating";
import { CommentButton, LikeButton } from "@/components/reviews/LikeButton";
import { SpoilerGate } from "@/components/reviews/SpoilerGate";
import { FeedActorAvatar } from "./FeedActorAvatar";
import { FeedCardHeader } from "./FeedCardHeader";
import { getReviewVerbPrefix, toSeasonEpisodeLabel, truncateQuote } from "./feed.utils";

type ReviewActivityCardProps = {
  item: FeedItem;
  onToggleLike: (reviewId: string, liked: boolean) => void;
};

const getBodyFallback = (item: FeedItem): string => {
  if (item.kind === "commented") return "Left a comment on a review.";
  if (item.kind === "liked_review") return "Liked a review.";
  return "Shared a review.";
};

export const ReviewActivityCard = memo(function ReviewActivityCard({
  item,
  onToggleLike,
}: ReviewActivityCardProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const movie = item.movie;
  const reviewId = item.review?.id ?? item.metadata.reviewId ?? null;
  const showRating = item.kind === "review" || item.kind === "diary_entry";
  const rating = item.review?.rating ?? item.metadata.rating;
  const accent = movie?.mediaType === "tv" ? colors.serial : colors.movie;
  const seLabel = toSeasonEpisodeLabel(item);
  const reviewOwner = item.metadata.targetUsername ?? item.actor.username;
  // Same resolution as the web's useReviewActivityCard: comment activities
  // show the comment excerpt, likes show the excerpt, reviews the review.
  const content =
    item.kind === "commented"
      ? (item.metadata.excerpt ?? item.review?.content ?? "")
      : item.kind === "liked_review"
        ? (item.metadata.excerpt ?? "")
        : (item.review?.content ?? item.metadata.excerpt ?? "");
  const containsSpoilers = showRating && item.review?.containsSpoilers === true;
  const quotedOriginal = item.kind === "commented" ? item.review?.content : null;

  const openReview = () => {
    if (reviewId) {
      router.push({
        pathname: "/review/[username]/[reviewId]",
        params: { username: reviewOwner, reviewId },
      });
    }
  };

  return (
    <Surface onPress={reviewId ? openReview : undefined} padding={18}>
      <View style={{ flexDirection: "row", gap: 12 }}>
        <FeedActorAvatar actor={item.actor} size={44} />
        <View style={{ flex: 1 }}>
          <FeedCardHeader
            username={item.actor.username}
            displayName={item.actor.displayUsername ?? item.actor.username}
            createdAt={item.createdAt}
          />
          <AppText size={15} style={{ marginTop: 2 }}>
            {getReviewVerbPrefix(item)}
            {movie ? (
              <AppText
                variant="display"
                size={15}
                onPress={() => router.push(mediaHref(movie.mediaType, movie.tmdbId))}
              >
                {` ${movie.title}`}
              </AppText>
            ) : null}
            {seLabel ? <AppText tone="muted" size={15}>{` · ${seLabel}`}</AppText> : null}
            {item.metadata.rewatch ? <AppText tone="muted" size={15}> · rewatch</AppText> : null}
          </AppText>

          {showRating && rating !== null ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 }}>
              <AppText size={14} weight="bold">
                {rating}
                <AppText size={11} tone="muted">
                  /10
                </AppText>
              </AppText>
              <RocketRatingDisplay rating={rating} size={11} color={accent} />
            </View>
          ) : null}

          <SpoilerGate
            containsSpoilers={containsSpoilers}
            content={content || getBodyFallback(item)}
            numberOfLines={4}
          />

          {quotedOriginal ? (
            <View style={{ marginTop: 8, borderLeftWidth: 2, borderLeftColor: colors.border, paddingLeft: 10 }}>
              <AppText size={12} tone="muted">
                “{truncateQuote(quotedOriginal, 140)}”
              </AppText>
            </View>
          ) : null}

          {showRating && movie?.posterPath ? (
            <Poster posterPath={movie.posterPath} width={88} style={{ marginTop: 12 }} />
          ) : null}

          {showRating ? (
            <View style={{ flexDirection: "row", gap: 22, marginTop: 14 }}>
              <CommentButton count={item.engagement.commentCount} disabled={!reviewId} onPress={openReview} />
              <LikeButton
                count={item.engagement.likeCount}
                isLiked={Boolean(item.engagement.viewerHasLiked)}
                disabled={!reviewId}
                onPress={() => reviewId && onToggleLike(reviewId, !item.engagement.viewerHasLiked)}
              />
            </View>
          ) : null}
        </View>
      </View>
    </Surface>
  );
});
