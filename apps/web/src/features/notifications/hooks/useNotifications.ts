import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/features/notifications/api";

const UNREAD_COUNT_POLL_INTERVAL_MS = 30_000;

export const notificationKeys = {
  list: ["notifications", "list"] as const,
  unreadCount: ["notifications", "unread-count"] as const,
};

export const useNotificationsList = (enabled: boolean) =>
  useQuery({
    queryKey: notificationKeys.list,
    queryFn: () => getNotifications(20),
    enabled,
  });

export const useUnreadNotificationCount = (enabled = true) =>
  useQuery({
    queryKey: notificationKeys.unreadCount,
    queryFn: getUnreadNotificationCount,
    enabled,
    refetchInterval: enabled ? UNREAD_COUNT_POLL_INTERVAL_MS : false,
  });

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: notificationKeys.list }),
        queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount }),
      ]);
    },
  });
};

export const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: notificationKeys.list }),
        queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount }),
      ]);
    },
  });
};
