import { useRouter } from "expo-router";
import { Bell, Settings } from "lucide-react-native";
import { View } from "react-native";
import { useTheme } from "@/theme";
import { useAuth } from "@/hooks/useAuth";
import { useUnreadNotificationCount } from "@/hooks/useNotifications";
import { EmptyView, IconButton, LoadingView, Screen, TabHeader, BrandMark } from "@/components/ui";
import { ProfileScreen } from "./ProfileScreen";

export const MeScreen = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const { user, isUserLoading } = useAuth();
  const unreadQuery = useUnreadNotificationCount(Boolean(user));

  return (
    <Screen withTopInset>
      <TabHeader
        kicker={user ? `@${user.username}` : "Profile"}
        title="You"
        trailing={
          <View style={{ flexDirection: "row" }}>
            {user ? (
              <IconButton
                accessibilityLabel="Notifications"
                badge={unreadQuery.data ?? 0}
                onPress={() => router.push("/notifications")}
                icon={<Bell size={20} color={colors.mutedForeground} />}
              />
            ) : null}
            <IconButton
              accessibilityLabel="Settings"
              onPress={() => router.push("/settings")}
              icon={<Settings size={20} color={colors.mutedForeground} />}
            />
          </View>
        }
      />
      {isUserLoading ? (
        <LoadingView />
      ) : user ? (
        <ProfileScreen username={user.username} />
      ) : (
        <EmptyView
          icon={<BrandMark size={52} />}
          title="Your journal lives here"
          message="Sign in to see your diary, reviews, likes and watchlist."
          action={{ label: "Sign in", onPress: () => router.push("/login") }}
          style={{ paddingTop: 60 }}
        />
      )}
    </Screen>
  );
};
