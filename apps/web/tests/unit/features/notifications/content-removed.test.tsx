import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient } from "@tanstack/react-query";
import { server } from "../../../support/msw/server";
import { renderWithProviders } from "../../../support/render/render-with-providers";
import { authKeys } from "@/features/auth/hooks/useAuth";
import { NotificationsBell } from "@/components/layout/navbar/parts/NotificationsBell";

describe("a moderator's notice in the bell", () => {
  it("says what was removed and why, without a link or a name", async () => {
    const user = userEvent.setup();
    server.use(
      http.get("*/api/notifications/unread-count", () => HttpResponse.json({ count: 1 })),
      http.get("*/api/notifications", () =>
        HttpResponse.json({
          items: [
            {
              id: "n1",
              actorId: "user_1",
              actorUsername: "cinefan",
              type: "content_removed",
              entityId: "p1",
              metadata: JSON.stringify({ targetType: "post_comment", reason: "Advertising", excerpt: "Buy cheap watches" }),
              isRead: false,
              createdAt: "2026-11-06T10:00:00.000Z",
            },
          ],
          nextCursor: null,
        }),
      ),
    );
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    queryClient.setQueryData(authKeys.me, { id: "user_1", username: "cinefan" });
    renderWithProviders(<NotificationsBell />, { queryClient });

    await user.click(await screen.findByRole("button", { name: "Open notifications" }));

    expect(await screen.findByText("A moderator removed your comment")).toBeInTheDocument();
    expect(screen.getByText("“Buy cheap watches” · Advertising")).toBeInTheDocument();
    expect(screen.queryByText("cinefan")).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
