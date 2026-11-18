import { describe, expect, it } from "vitest";
import { delay, http, HttpResponse } from "msw";
import { screen, waitForElementToBeRemoved, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient } from "@tanstack/react-query";
import { server } from "../../../support/msw/server";
import { renderWithProviders } from "../../../support/render/render-with-providers";
import { authKeys } from "@/features/auth/hooks/useAuth";
import { AdminUsersPanel } from "@/features/admin/components/AdminUsersPanel";

const adminUser = (username: string) => ({
  id: `id-${username}`,
  username,
  displayUsername: null,
  avatarUrl: null,
  email: `${username}@example.com`,
  isAdmin: false,
  isSuspended: false,
  createdAt: "2026-11-01T00:00:00.000Z",
});

describe("AdminUsersPanel search", () => {
  it("keeps an open row dialog while the debounced search loads", async () => {
    const user = userEvent.setup();
    server.use(
      http.get("*/api/admin/users", async ({ request }) => {
        const query = new URL(request.url).searchParams.get("query");
        if (!query) return HttpResponse.json([adminUser("reel_drifter"), adminUser("other_one")]);
        await delay(100);
        return HttpResponse.json([adminUser("reel_drifter")]);
      }),
    );
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    queryClient.setQueryData(authKeys.me, { id: "a1", username: "glory42", isAdmin: true });
    renderWithProviders(<AdminUsersPanel />, { routePath: "/admin/users", queryClient });

    await user.type(await screen.findByPlaceholderText("Search by username..."), "reel");
    const row = screen.getByRole("row", { name: /reel_drifter/ });
    await user.click(within(row).getByRole("button", { name: "Suspend" }));
    expect(screen.getByRole("dialog", { name: "Suspend account" })).toBeInTheDocument();

    await waitForElementToBeRemoved(() => screen.queryByText("@other_one"));
    expect(screen.getByRole("dialog", { name: "Suspend account" })).toBeInTheDocument();
  });
});
