import { FlatList, Pressable, View } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useTheme } from "@/theme";
import { useFollowList } from "@/hooks/useSocial";
import { AppText, Avatar, EmptyView, ErrorView, LoadingView, Screen } from "@/components/ui";

export const FollowListScreen = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ username: string; kind?: string }>();
  const kind = params.kind === "following" ? "following" : "followers";
  const listQuery = useFollowList(params.username, kind);

  return (
    <Screen>
      <Stack.Screen options={{ title: kind === "followers" ? "Followers" : "Following" }} />
      <FlatList
        data={listQuery.data ?? []}
        keyExtractor={(user) => user.id}
        contentContainerStyle={{ paddingVertical: 8 }}
        renderItem={({ item: user }) => (
          <Pressable
            onPress={() => router.push({ pathname: "/user/[username]", params: { username: user.username } })}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: colors.rowBorder,
              backgroundColor: pressed ? colors.pillBg : "transparent",
            })}
          >
            <Avatar username={user.username} avatarUrl={user.avatarUrl} size={40} />
            <View>
              <AppText weight="semibold">{user.displayUsername ?? user.username}</AppText>
              <AppText variant="mono" size={11} tone="muted">
                @{user.username}
              </AppText>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          listQuery.isPending ? (
            <LoadingView />
          ) : listQuery.isError ? (
            <ErrorView onRetry={() => void listQuery.refetch()} />
          ) : (
            <EmptyView title={kind === "followers" ? "No followers yet" : "Not following anyone yet"} />
          )
        }
      />
    </Screen>
  );
};
