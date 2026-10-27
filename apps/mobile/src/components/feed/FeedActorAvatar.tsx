import { Pressable } from "react-native";
import { useRouter } from "expo-router";
import type { FeedItem } from "@/types/feed";
import { Avatar } from "@/components/ui";

export const FeedActorAvatar = ({ actor, size }: { actor: FeedItem["actor"]; size: number }) => {
  const router = useRouter();

  return (
    <Pressable
      accessibilityLabel={`Open @${actor.username}`}
      onPress={() => router.push({ pathname: "/user/[username]", params: { username: actor.username } })}
    >
      <Avatar username={actor.username} avatarUrl={actor.avatarUrl} size={size} />
    </Pressable>
  );
};
