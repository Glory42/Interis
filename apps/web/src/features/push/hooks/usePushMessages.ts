import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { notificationKeys } from "@/features/notifications/hooks/useNotifications";
import { PUSH_OPEN_URL, PUSH_RECEIVED, toAppPath } from "@/features/push/push-messages";

// Listens to the service worker: a push refreshes the bell, a tapped notification opens its page here.
export const usePushMessages = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const container = navigator.serviceWorker;

    const handleMessage = (event: MessageEvent) => {
      const data = event.data as { type?: unknown; url?: unknown } | null;
      if (data?.type === PUSH_RECEIVED) {
        void queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount });
        void queryClient.invalidateQueries({ queryKey: notificationKeys.list });
        return;
      }
      const path = data?.type === PUSH_OPEN_URL ? toAppPath(data.url) : null;
      if (path) router.history.push(path);
    };

    container.addEventListener("message", handleMessage);
    return () => container.removeEventListener("message", handleMessage);
  }, [queryClient, router]);
};
