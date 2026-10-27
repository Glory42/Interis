import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/api/notifications";

export const notificationKeys = {
  list: ["notifications", "list"] as const,
  unreadCount: ["notifications", "unread-count"] as const,
};

// No refetchInterval on purpose: polling keeps Neon compute awake 24/7
// (CLAUDE.md, 2026-10-21 incident). The count refreshes on mount and when
// the app returns to the foreground.
export const useUnreadNotificationCount = (enabled: boolean) =>
  useQuery({
    queryKey: notificationKeys.unreadCount,
    queryFn: getUnreadNotificationCount,
    enabled,
    staleTime: 60_000,
  });

export const useNotificationsList = () =>
  useInfiniteQuery({
    queryKey: notificationKeys.list,
    queryFn: ({ pageParam }) => getNotifications(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount }),
        queryClient.invalidateQueries({ queryKey: notificationKeys.list }),
      ]),
  });
};

export const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount }),
        queryClient.invalidateQueries({ queryKey: notificationKeys.list }),
      ]),
  });
};
