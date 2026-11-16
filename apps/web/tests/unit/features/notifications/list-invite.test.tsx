import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient } from "@tanstack/react-query";
import { server } from "../../../support/msw/server";
import { renderWithProviders } from "../../../support/render/render-with-providers";
import { authKeys } from "@/features/auth/hooks/useAuth";
import { NotificationsBell } from "@/components/layout/navbar/parts/NotificationsBell";

const notification = (type: string, actorUsername: string) => ({
  id: `n-${type}`,
  actorId: `user_${actorUsername}`,
  actorUsername,
  type,
  entityId: "list-1",
  metadata: JSON.stringify({ listTitle: "Heist films" }),
  isRead: false,
  createdAt: "2026-11-06T10:00:00.000Z",
});

const renderBell = async (items: unknown[]) => {
  server.use(
    http.get("*/api/notifications/unread-count", () => HttpResponse.json({ count: items.length })),
    http.get("*/api/notifications", () => HttpResponse.json({ items, nextCursor: null })),
  );
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  queryClient.setQueryData(authKeys.me, { id: "user_me", username: "me" });
  const user = userEvent.setup();
  renderWithProviders(<NotificationsBell />, { queryClient });
  await user.click(await screen.findByRole("button", { name: "Open notifications" }));
  return user;
};

describe("List Collaborator notifications in the bell", () => {
  it("lets the invitee accept a list invite from the bell", async () => {
    let accepted = false;
    server.use(
      http.post("*/api/lists/list-1/collaborators/accept", () => {
        accepted = true;
        return HttpResponse.json({ success: true });
      }),
    );
    const user = await renderBell([notification("list_invite", "owner")]);

    expect(await screen.findByRole("link", { name: "owner invited you to edit “Heist films”" })).toHaveAttribute(
      "href",
      "/profile/owner/lists/list-1",
    );
    expect(screen.getByRole("button", { name: "Decline" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Accept" }));
    await waitFor(() => expect(accepted).toBe(true));
  });

  it("lets the invitee decline, which removes them from the list", async () => {
    let declinedUserId: string | null = null;
    server.use(
      http.delete("*/api/lists/list-1/collaborators/:userId", ({ params }) => {
        declinedUserId = String(params.userId);
        return HttpResponse.json({ success: true });
      }),
    );
    const user = await renderBell([notification("list_invite", "owner")]);

    await user.click(await screen.findByRole("button", { name: "Decline" }));
    await waitFor(() => expect(declinedUserId).toBe("user_me"));
  });

  it("tells the owner who joined their list, linking to it", async () => {
    await renderBell([notification("list_invite_accepted", "friend")]);
    const link = await screen.findByRole("link", { name: /joined your list “Heist films”/ });
    expect(link).toHaveAttribute("href", "/profile/me/lists/list-1");
  });
});
