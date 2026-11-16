import { afterEach, describe, expect, it } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import { act, screen } from "@testing-library/react";
import { renderWithProviders } from "../../../support/render/render-with-providers";
import { notificationKeys } from "@/features/notifications/hooks/useNotifications";
import { usePushMessages } from "@/features/push/hooks/usePushMessages";
import { PUSH_OPEN_URL, PUSH_RECEIVED } from "@/features/push/push-messages";

const Listener = () => {
  usePushMessages();
  return <p>listening</p>;
};

const fakeServiceWorker = () => {
  const target = new EventTarget();
  Object.defineProperty(navigator, "serviceWorker", { configurable: true, value: target });
  return (data: unknown) => act(() => void target.dispatchEvent(new MessageEvent("message", { data })));
};

afterEach(() => {
  Reflect.deleteProperty(navigator, "serviceWorker");
});

describe("messages from the service worker", () => {
  it("refreshes only the bell's queries when a push arrives", async () => {
    const post = fakeServiceWorker();
    const queryClient = new QueryClient();
    queryClient.setQueryData(notificationKeys.unreadCount, 1);
    queryClient.setQueryData(notificationKeys.list, { items: [], nextCursor: null });
    queryClient.setQueryData(["notifications", "something-else"], 1);
    queryClient.setQueryData(["feed"], []);
    renderWithProviders(<Listener />, { queryClient });
    await screen.findByText("listening");

    await post({ type: PUSH_RECEIVED });

    const invalidated = (key: readonly unknown[]) => queryClient.getQueryState(key)?.isInvalidated;
    expect(invalidated(notificationKeys.unreadCount)).toBe(true);
    expect(invalidated(notificationKeys.list)).toBe(true);
    expect(invalidated(["notifications", "something-else"])).toBe(false);
    expect(invalidated(["feed"])).toBe(false);
  });

  it("opens a tapped notification's page in the app, and only app paths", async () => {
    const post = fakeServiceWorker();
    const { router } = renderWithProviders(<Listener />);
    await screen.findByText("listening");

    await post({ type: PUSH_OPEN_URL, url: "https://evil.test/" });
    await post({ type: PUSH_OPEN_URL, url: "//evil.test/" });
    expect(router.history.location.pathname).toBe("/");

    await post({ type: PUSH_OPEN_URL, url: "/profile/cinefan" });
    expect(router.history.location.pathname).toBe("/profile/cinefan");
  });
});
