import { useState } from "react";
import { FlatList, KeyboardAvoidingView, Platform, Pressable, View } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Send } from "lucide-react-native";
import { mediaHref } from "@/lib/media";
import { formatRelativeTime } from "@/lib/time";
import { useTheme } from "@/theme";
import { useAuth } from "@/hooks/useAuth";
import {
  useAddReviewComment,
  useReviewComments,
  useReviewDetail,
  useToggleReviewLike,
} from "@/hooks/useReviews";
import {
  AppText,
  Avatar,
  ErrorView,
  IconButton,
  LoadingView,
  Screen,
  SectionHeader,
  Surface,
  TextField,
} from "@/components/ui";
import { Poster } from "@/components/media/Poster";
import { RocketRatingDisplay } from "@/components/media/RocketRating";
import { CommentButton, LikeButton } from "@/components/reviews/LikeButton";
import { SpoilerGate } from "@/components/reviews/SpoilerGate";

export const ReviewDetailScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { username, reviewId } = useLocalSearchParams<{ username: string; reviewId: string }>();
  const { user } = useAuth();
  const [comment, setComment] = useState("");

  const reviewQuery = useReviewDetail(username, reviewId);
  const commentsQuery = useReviewComments(reviewId);
  const addComment = useAddReviewComment(reviewId);
  const toggleLike = useToggleReviewLike();

  if (reviewQuery.isPending) {
    return (
      <Screen>
        <LoadingView />
      </Screen>
    );
  }

  if (reviewQuery.isError || !reviewQuery.data) {
    return (
      <Screen>
        <ErrorView message="Could not load this review." onRetry={() => void reviewQuery.refetch()} />
      </Screen>
    );
  }

  const review = reviewQuery.data;
  const accent = review.mediaType === "tv" ? colors.serial : colors.movie;
  const authorName = review.author.displayUsername ?? review.author.username;

  const submitComment = async () => {
    if (!comment.trim()) return;
    try {
      await addComment.mutateAsync(comment);
      setComment("");
    } catch {
      // toast raised by the hook
    }
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: "Review" }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
        style={{ flex: 1 }}
      >
        <FlatList
          data={commentsQuery.data ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 24 }}
          ListHeaderComponent={
            <View style={{ gap: 16, marginBottom: 8 }}>
              <Pressable
                onPress={() => router.push(mediaHref(review.mediaType, review.media.tmdbId))}
                style={{ flexDirection: "row", gap: 14, alignItems: "center" }}
              >
                <Poster posterPath={review.media.posterPath} width={64} accentColor={accent} />
                <View style={{ flex: 1 }}>
                  <AppText variant="kicker" size={9} color={accent}>
                    {review.mediaType === "tv" ? "Serial" : "Movie"}
                  </AppText>
                  <AppText variant="display" size={20}>
                    {review.media.title}
                  </AppText>
                  <AppText size={12} tone="muted">
                    {[review.media.releaseYear, review.media.director ?? review.media.creator]
                      .filter(Boolean)
                      .join(" · ")}
                  </AppText>
                </View>
              </Pressable>

              <Surface>
                <Pressable
                  onPress={() =>
                    router.push({ pathname: "/user/[username]", params: { username: review.author.username } })
                  }
                  style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
                >
                  <Avatar username={review.author.username} avatarUrl={review.author.avatarUrl} size={38} />
                  <View>
                    <AppText variant="display" size={15}>
                      {authorName}
                    </AppText>
                    <AppText size={12} tone="muted">
                      {formatRelativeTime(review.createdAt, { maxUnit: "year" })}
                    </AppText>
                  </View>
                </Pressable>
                {review.rating !== null ? (
                  <View style={{ marginTop: 12 }}>
                    <RocketRatingDisplay rating={review.rating} size={14} color={accent} />
                  </View>
                ) : undefined}
                <SpoilerGate containsSpoilers={review.containsSpoilers} content={review.content} />
                <View style={{ flexDirection: "row", gap: 22, marginTop: 14 }}>
                  <CommentButton count={review.engagement.commentCount} disabled />
                  <LikeButton
                    count={review.engagement.likeCount}
                    isLiked={Boolean(review.engagement.viewerHasLiked)}
                    disabled={!user}
                    onPress={() =>
                      toggleLike.mutate({ reviewId: review.id, liked: !review.engagement.viewerHasLiked })
                    }
                  />
                </View>
              </Surface>

              <SectionHeader label={`Comments · ${review.engagement.commentCount}`} color={accent} />
              {commentsQuery.isPending ? <LoadingView style={{ paddingVertical: 16 }} /> : undefined}
            </View>
          }
          renderItem={({ item }) => (
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Avatar username={item.authorUsername} avatarUrl={item.authorAvatarUrl} size={30} />
              <View style={{ flex: 1 }}>
                <AppText size={13}>
                  <AppText size={13} weight="semibold">
                    {item.authorDisplayUsername ?? item.authorUsername}
                  </AppText>
                  <AppText size={12} tone="muted">{`  ${formatRelativeTime(item.createdAt)}`}</AppText>
                </AppText>
                <AppText size={14} style={{ marginTop: 2 }}>
                  {item.content}
                </AppText>
              </View>
            </View>
          )}
          ListEmptyComponent={
            commentsQuery.isPending ? undefined : (
              <AppText tone="muted" size={13}>
                No comments yet.
              </AppText>
            )
          }
        />

        {user ? (
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-end",
              gap: 8,
              paddingHorizontal: 16,
              paddingTop: 10,
              paddingBottom: insets.bottom + 10,
              borderTopWidth: 1,
              borderTopColor: colors.rowBorder,
              backgroundColor: colors.background,
            }}
          >
            <View style={{ flex: 1 }}>
              <TextField
                value={comment}
                onChangeText={setComment}
                placeholder="Add a comment…"
                maxLength={2000}
                onSubmitEditing={submitComment}
                returnKeyType="send"
              />
            </View>
            <IconButton
              accessibilityLabel="Send comment"
              onPress={submitComment}
              icon={<Send size={20} color={comment.trim() ? colors.primary : colors.faint} />}
              style={{ marginBottom: 4 }}
            />
          </View>
        ) : undefined}
      </KeyboardAvoidingView>
    </Screen>
  );
};
