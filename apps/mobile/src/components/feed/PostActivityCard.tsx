import { memo } from "react";
import { View } from "react-native";
import type { FeedItem } from "@/types/feed";
import { AppText, Surface } from "@/components/ui";
import { MediaPreviewCard } from "@/components/media/MediaPreviewCard";
import { CommentButton, LikeButton } from "@/components/reviews/LikeButton";
import { FeedActorAvatar } from "./FeedActorAvatar";
import { FeedCardHeader } from "./FeedCardHeader";

const getPostVerb = (item: FeedItem): string | null => {
  if (item.kind === "liked_post") {
    return item.metadata.targetUsername ? `Liked @${item.metadata.targetUsername}'s post` : "Liked a post";
  }
  if (item.kind === "commented_post") {
    return item.metadata.targetUsername
      ? `Commented on @${item.metadata.targetUsername}'s post`
      : "Commented on a post";
  }
  return null;
};

// Posts are read-only on mobile for now: content, attached title, counts.
export const PostActivityCard = memo(function PostActivityCard({ item }: { item: FeedItem }) {
  const verb = getPostVerb(item);
  const content = item.post?.content ?? item.metadata.excerpt ?? "";

  return (
    <Surface padding={18}>
      <View style={{ flexDirection: "row", gap: 12 }}>
        <FeedActorAvatar actor={item.actor} size={44} />
        <View style={{ flex: 1 }}>
          <FeedCardHeader
            username={item.actor.username}
            displayName={item.actor.displayUsername ?? item.actor.username}
            createdAt={item.createdAt}
          />
          {verb ? (
            <AppText size={14} tone="muted" style={{ marginTop: 2 }}>
              {verb}
            </AppText>
          ) : null}
          {content ? (
            <AppText size={15} style={{ marginTop: 6 }} numberOfLines={8}>
              {content}
            </AppText>
          ) : null}
          {item.movie ? (
            <MediaPreviewCard
              mediaType={item.movie.mediaType}
              tmdbId={item.movie.tmdbId}
              title={item.movie.title}
              releaseYear={item.movie.releaseYear}
              posterPath={item.movie.posterPath}
            />
          ) : null}
          {item.kind === "post" ? (
            <View style={{ flexDirection: "row", gap: 22, marginTop: 14 }}>
              <CommentButton count={item.engagement.commentCount} disabled />
              <LikeButton
                count={item.engagement.likeCount}
                isLiked={Boolean(item.engagement.viewerHasLiked)}
                disabled
              />
            </View>
          ) : null}
        </View>
      </View>
    </Surface>
  );
});
