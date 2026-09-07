import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { server } from "../../../support/msw/server";
import {
  notificationKeys,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationsList,
  useUnreadNotificationCount,
} from "@/features/notifications/hooks/useNotifications";

const createTestQueryClient = (): QueryClient =>
  new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

const wrapperFor = (queryClient: QueryClient) => {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return Wrapper;
};

const seed = (queryClient: QueryClient) => {
  queryClient.setQueryData(notificationKeys.list, { items: [], nextCursor: null });
  queryClient.setQueryData(notificationKeys.unreadCount, 3);
};

const isInvalidated = (queryClient: QueryClient, key: readonly unknown[]) =>
  queryClient.getQueryState(key)?.isInvalidated ?? false;

describe("useNotificationsList", () => {
  it("does not fetch while disabled", async () => {
    const queryClient = createTestQueryClient();
    const { result } = renderHook(() => useNotificationsList(false), {
      wrapper: wrapperFor(queryClient),
    });
    expect(result.current.fetchStatus).toBe("idle");
    expect(result.current.data).toBeUndefined();
  });
});

describe("useUnreadNotificationCount", () => {
  it("unwraps the count from the payload", async () => {
    server.use(
      http.get("*/api/notifications/unread-count", () => HttpResponse.json({ count: 7 })),
    );
    const queryClient = createTestQueryClient();
    const { result } = renderHook(() => useUnreadNotificationCount(), {
      wrapper: wrapperFor(queryClient),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBe(7);
  });
});

describe("mark-read mutations", () => {
  it("useMarkNotificationRead invalidates both the list and the unread count", async () => {
    server.use(
      http.post("*/api/notifications/n1/read", () => HttpResponse.json({ success: true })),
    );
    const queryClient = createTestQueryClient();
    seed(queryClient);

    const { result } = renderHook(() => useMarkNotificationRead(), {
      wrapper: wrapperFor(queryClient),
    });
    result.current.mutate("n1");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(isInvalidated(queryClient, notificationKeys.list)).toBe(true);
    expect(isInvalidated(queryClient, notificationKeys.unreadCount)).toBe(true);
  });

  it("useMarkAllNotificationsRead invalidates both the list and the unread count", async () => {
    server.use(
      http.post("*/api/notifications/read-all", () => HttpResponse.json({ success: true })),
    );
    const queryClient = createTestQueryClient();
    seed(queryClient);

    const { result } = renderHook(() => useMarkAllNotificationsRead(), {
      wrapper: wrapperFor(queryClient),
    });
    result.current.mutate();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(isInvalidated(queryClient, notificationKeys.list)).toBe(true);
    expect(isInvalidated(queryClient, notificationKeys.unreadCount)).toBe(true);
  });

  it("does not invalidate anything when the request fails", async () => {
    server.use(
      http.post("*/api/notifications/n1/read", () =>
        HttpResponse.json({ error: "no" }, { status: 500 }),
      ),
    );
    const queryClient = createTestQueryClient();
    seed(queryClient);

    const { result } = renderHook(() => useMarkNotificationRead(), {
      wrapper: wrapperFor(queryClient),
    });
    result.current.mutate("n1");
    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(isInvalidated(queryClient, notificationKeys.list)).toBe(false);
    expect(isInvalidated(queryClient, notificationKeys.unreadCount)).toBe(false);
  });
});
