import { Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { formatRelativeTime } from "@/lib/time";
import { AppText } from "@/components/ui";

type FeedCardHeaderProps = {
  username: string;
  displayName: string;
  createdAt: string;
};

// Shared "name · time" byline used by every feed card tier.
export const FeedCardHeader = ({ username, displayName, createdAt }: FeedCardHeaderProps) => {
  const router = useRouter();

  return (
    <View style={{ flexDirection: "row", alignItems: "baseline", flexWrap: "wrap", gap: 6 }}>
      <Pressable
        hitSlop={6}
        onPress={() => router.push({ pathname: "/user/[username]", params: { username } })}
      >
        <AppText variant="display" size={15}>
          {displayName}
        </AppText>
      </Pressable>
      <AppText size={13} tone="muted">
        · {formatRelativeTime(createdAt)}
      </AppText>
    </View>
  );
};
