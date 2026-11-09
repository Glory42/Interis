import { describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient } from "@tanstack/react-query";
import { server } from "../../../support/msw/server";
import { renderWithProviders } from "../../../support/render/render-with-providers";
import { authKeys } from "@/features/auth/hooks/useAuth";
import { notificationKeys } from "@/features/notifications/hooks/useNotifications";
import { NotificationsBell } from "@/components/layout/navbar/parts/NotificationsBell";

const followNotification = (id: string, actorUsername: string, isRead: boolean) => ({
  id,
  actorId: `actor_${id}`,
  actorUsername,
  type: "follow",
  entityId: `actor_${id}`,
  metadata: null,
  isRead,
  createdAt: "2026-11-06T10:00:00.000Z",
});

const renderBell = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  queryClient.setQueryData(authKeys.me, { id: "user_1", username: "cinefan" });
  renderWithProviders(<NotificationsBell />, { queryClient });
  return queryClient;
};

describe("deleting notifications from the bell", () => {
  it("removes one row at once, drops its unread mark, and does not navigate", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    let items = [followNotification("n1", "walt", false), followNotification("n2", "jesse", true)];
    server.use(
      http.get("*/api/notifications/unread-count", () =>
        HttpResponse.json({ count: items.filter((item) => !item.isRead).length }),
      ),
      http.get("*/api/notifications", () => HttpResponse.json({ items, nextCursor: null })),
      http.delete("*/api/notifications/:id", async ({ params }) => {
        onDelete(params.id);
        await new Promise((resolve) => setTimeout(resolve, 20));
        items = items.filter((item) => item.id !== params.id);
        return HttpResponse.json({ success: true });
      }),
    );
    const queryClient = renderBell();

    await user.click(await screen.findByRole("button", { name: "Open notifications" }));
    expect(await screen.findByText("walt")).toBeInTheDocument();

    const [deleteWalt] = screen.getAllByRole("button", { name: "Delete notification" });
    await user.click(deleteWalt!);

    expect(screen.queryByText("walt")).not.toBeInTheDocument();
    expect(queryClient.getQueryData(notificationKeys.unreadCount)).toBe(0);
    expect(screen.getByText("jesse")).toBeInTheDocument();
    // Still open: the button sits beside the row's link, not inside it.
    expect(screen.getByRole("menu", { name: "Notifications" })).toBeInTheDocument();
    await waitFor(() => expect(onDelete).toHaveBeenCalledWith("n1"));
  });

  it("clears everything after a confirming second click", async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();
    server.use(
      http.get("*/api/notifications/unread-count", () => HttpResponse.json({ count: 1 })),
      http.get("*/api/notifications", () =>
        HttpResponse.json({ items: [followNotification("n1", "walt", false)], nextCursor: null }),
      ),
      http.delete("*/api/notifications", () => {
        onClear();
        return HttpResponse.json({ success: true });
      }),
    );
    const queryClient = renderBell();

    await user.click(await screen.findByRole("button", { name: "Open notifications" }));
    expect(await screen.findByText("walt")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Clear all notifications" }));
    expect(onClear).not.toHaveBeenCalled();
    expect(screen.getByText("walt")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Confirm clearing all notifications" }));
    expect(await screen.findByText("No notifications yet.")).toBeInTheDocument();
    expect(queryClient.getQueryData(notificationKeys.unreadCount)).toBe(0);
    await waitFor(() => expect(onClear).toHaveBeenCalledTimes(1));
  });

  it("puts the rows back if clearing fails", async () => {
    const user = userEvent.setup();
    server.use(
      http.get("*/api/notifications/unread-count", () => HttpResponse.json({ count: 1 })),
      http.get("*/api/notifications", () =>
        HttpResponse.json({ items: [followNotification("n1", "walt", false)], nextCursor: null }),
      ),
      http.delete("*/api/notifications", () => HttpResponse.json({ error: "nope" }, { status: 400 })),
    );
    renderBell();

    await user.click(await screen.findByRole("button", { name: "Open notifications" }));
    expect(await screen.findByText("walt")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Clear all notifications" }));
    await user.click(screen.getByRole("button", { name: "Confirm clearing all notifications" }));

    expect(await screen.findByText("walt")).toBeInTheDocument();
  });
});
