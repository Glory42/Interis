import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  clearNotifications,
  deleteNotification,
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationPage,
} from "@/features/notifications/api";

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
    // No interval polling: any query inside Neon's 5-min idle window keeps compute awake,
    // so a 60s poll from one open tab burned the Free plan's compute hours (2026-10-21).
    refetchOnWindowFocus: true,
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

const deleteMutationKey = ["notifications", "delete"] as const;

// Drops the row (and its unread mark) at once; the list is refetched when the
// last of a burst of deletes settles, so an earlier refetch can't bring rows back.
export const useDeleteNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: deleteMutationKey,
    mutationFn: (id: string) => deleteNotification(id),
    onMutate: async (id) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: notificationKeys.list }),
        queryClient.cancelQueries({ queryKey: notificationKeys.unreadCount }),
      ]);
      const page = queryClient.getQueryData<NotificationPage>(notificationKeys.list);
      const removed = page?.items.find((item) => item.id === id);
      queryClient.setQueryData<NotificationPage>(notificationKeys.list, (old) =>
        old ? { ...old, items: old.items.filter((item) => item.id !== id) } : old,
      );
      if (removed && !removed.isRead) {
        queryClient.setQueryData<number>(notificationKeys.unreadCount, (old) =>
          old === undefined ? old : Math.max(0, old - 1),
        );
      }
    },
    onSettled: async () => {
      if (queryClient.isMutating({ mutationKey: deleteMutationKey }) > 1) return;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: notificationKeys.list }),
        queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount }),
      ]);
    },
  });
};

// Empties the bell at once and puts it back if the request fails.
export const useClearNotifications = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: clearNotifications,
    onMutate: async () => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: notificationKeys.list }),
        queryClient.cancelQueries({ queryKey: notificationKeys.unreadCount }),
      ]);
      const previousPage = queryClient.getQueryData<NotificationPage>(notificationKeys.list);
      const previousCount = queryClient.getQueryData<number>(notificationKeys.unreadCount);
      queryClient.setQueryData<NotificationPage>(notificationKeys.list, { items: [], nextCursor: null });
      queryClient.setQueryData<number>(notificationKeys.unreadCount, 0);
      return { previousPage, previousCount };
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(notificationKeys.list, context?.previousPage);
      queryClient.setQueryData(notificationKeys.unreadCount, context?.previousCount);
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
