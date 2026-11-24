import { memo } from "react";
import { Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import type { FeedItem } from "@/types/feed";
import { AppText, Surface } from "@/components/ui";
import { MediaPreviewCard } from "@/components/media/MediaPreviewCard";
import { FeedActorAvatar } from "./FeedActorAvatar";
import { FeedCardHeader } from "./FeedCardHeader";
import { getTimelineVerb } from "./feed.utils";

// Tier C: a plain timeline entry - avatar, byline, verb, attached title.
export const TimelineActivityCard = memo(function TimelineActivityCard({ item }: { item: FeedItem }) {
  const router = useRouter();
  const targetUsername = item.metadata.targetUsername;

  return (
    <Surface>
      <View style={{ flexDirection: "row", gap: 12 }}>
        <FeedActorAvatar actor={item.actor} size={40} />
        <View style={{ flex: 1 }}>
          <FeedCardHeader
            username={item.actor.username}
            displayName={item.actor.displayUsername ?? item.actor.username}
            createdAt={item.createdAt}
          />
          {item.kind === "followed_user" && targetUsername ? (
            <Pressable
              onPress={() =>
                router.push({ pathname: "/user/[username]", params: { username: targetUsername } })
              }
            >
              <AppText size={15} style={{ marginTop: 2 }}>
                {getTimelineVerb(item)}
              </AppText>
            </Pressable>
          ) : (
            <AppText size={15} style={{ marginTop: 2 }}>
              {getTimelineVerb(item)}
            </AppText>
          )}
          {item.kind === "created_list" && item.metadata.listTitle ? (
            <AppText size={14} weight="semibold" style={{ marginTop: 8 }}>
              {item.metadata.listTitle}
            </AppText>
          ) : item.movie ? (
            <MediaPreviewCard
              mediaType={item.movie.mediaType}
              tmdbId={item.movie.tmdbId}
              title={item.movie.title}
              releaseYear={item.movie.releaseYear}
              posterPath={item.movie.posterPath}
            />
          ) : null}
        </View>
      </View>
    </Surface>
  );
});
