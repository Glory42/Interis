import { useMemo } from "react";
import { FlatList, Pressable, View } from "react-native";
import { Stack, useRouter } from "expo-router";
import { formatRelativeTime } from "@/lib/time";
import { useTheme } from "@/theme";
import type { NotificationItem, NotificationType } from "@/types/notifications";
import { useAuth } from "@/hooks/useAuth";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationsList,
} from "@/hooks/useNotifications";
import { AppText, Avatar, Button, EmptyView, ErrorView, LoadingView, Screen } from "@/components/ui";

const NOTIFICATION_COPY: Record<NotificationType, string> = {
  follow: "started following you",
  like_review: "liked your review",
  like_post: "liked your post",
  like_activity: "liked your activity",
  comment_review: "commented on your review",
  comment_post: "commented on your post",
};

export const NotificationsScreen = () => {
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();
  const listQuery = useNotificationsList();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const items = useMemo(() => listQuery.data?.pages.flatMap((page) => page.items) ?? [], [listQuery.data]);
  const hasUnread = items.some((item) => !item.isRead);

  // Same routing as the web's NotificationsBell: review activity opens the
  // viewer's own review, everything else opens the actor's profile.
  const openNotification = (notification: NotificationItem) => {
    if (!notification.isRead) {
      markRead.mutate(notification.id);
    }
    if ((notification.type === "like_review" || notification.type === "comment_review") && user) {
      router.push({
        pathname: "/review/[username]/[reviewId]",
        params: { username: user.username, reviewId: notification.entityId },
      });
      return;
    }
    router.push({ pathname: "/user/[username]", params: { username: notification.actorUsername } });
  };

  return (
    <Screen>
      <Stack.Screen
        options={{
          title: "Notifications",
          headerRight: hasUnread
            ? () => (
                <Button
                  label="Mark all read"
                  variant="ghost"
                  size="sm"
                  loading={markAllRead.isPending}
                  onPress={() => markAllRead.mutate()}
                />
              )
            : undefined,
        }}
      />
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (listQuery.hasNextPage && !listQuery.isFetchingNextPage) {
            void listQuery.fetchNextPage();
          }
        }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => openNotification(item)}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              paddingHorizontal: 16,
              paddingVertical: 14,
              borderBottomWidth: 1,
              borderBottomColor: colors.rowBorder,
              backgroundColor: pressed ? colors.pillBg : item.isRead ? "transparent" : colors.glow,
            })}
          >
            <Avatar
              username={item.actorUsername}
              avatarUrl={item.actorAvatarUrl ?? item.actorImage ?? null}
              size={40}
            />
            <View style={{ flex: 1 }}>
              <AppText size={14}>
                <AppText size={14} weight="semibold">
                  {item.actorDisplayUsername ?? item.actorUsername}
                </AppText>{" "}
                {NOTIFICATION_COPY[item.type]}
              </AppText>
              <AppText size={12} tone="muted" style={{ marginTop: 2 }}>
                {formatRelativeTime(item.createdAt)}
              </AppText>
            </View>
            {!item.isRead ? (
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary }} />
            ) : undefined}
          </Pressable>
        )}
        ListEmptyComponent={
          listQuery.isPending ? (
            <LoadingView />
          ) : listQuery.isError ? (
            <ErrorView onRetry={() => void listQuery.refetch()} />
          ) : (
            <EmptyView title="All caught up" message="Follows, likes and comments will show up here." />
          )
        }
        ListFooterComponent={listQuery.isFetchingNextPage ? <LoadingView style={{ paddingVertical: 16 }} /> : undefined}
      />
    </Screen>
  );
};
