import { describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient } from "@tanstack/react-query";
import { server } from "../../../support/msw/server";
import { renderWithProviders } from "../../../support/render/render-with-providers";
import { authKeys } from "@/features/auth/hooks/useAuth";
import { AdminUserDetailPage } from "@/features/admin/components/AdminUserDetailPage";

const asAdmin = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  queryClient.setQueryData(authKeys.me, { id: "a1", username: "glory42", isAdmin: true });
  return queryClient;
};

const detail = (overrides: Record<string, unknown> = {}) => ({
  user: {
    id: "u1",
    username: "reel_drifter",
    displayUsername: null,
    email: "r.drifter@mail.example",
    avatarUrl: null,
    isAdmin: false,
    isSuspended: true,
    createdAt: "2025-03-14T10:00:00.000Z",
    suspendedAt: "2026-11-06T19:31:00.000Z",
    suspendedReason: "harassment, 3 reports",
    suspendedUntil: "2026-11-13T19:31:00.000Z",
    suspendedBy: "glory42",
    mustChangePassword: false,
    hasRecoveryQuestion: true,
    ...overrides,
  },
  counts: { movieEntryCount: 400, serialEntryCount: 18, reviewCount: 57, listCount: 4, followerCount: 88, followingCount: 131, reportsAgainst: 5, reportsFiled: 1 },
  sessions: [{ id: "s1", userAgent: "Mozilla/5.0 (X11; Linux x86_64; rv:130.0) Gecko/20100101 Firefox/130.0", ipAddress: "85.10.1.2", createdAt: "2026-11-06T10:00:00.000Z", lastActiveAt: "2026-11-06T17:00:00.000Z", expiresAt: "2026-12-06T10:00:00.000Z" }],
});

describe("AdminUserDetailPage", () => {
  it("shows the account, its counts, standing and sessions", async () => {
    server.use(http.get("*/api/admin/users/reel_drifter", () => HttpResponse.json(detail())));
    const { container } = renderWithProviders(<AdminUserDetailPage username="reel_drifter" />, { queryClient: asAdmin() });

    expect(await screen.findByRole("heading", { name: /@reel_drifter/ })).toHaveTextContent("suspended");
    expect(container).toHaveTextContent("r.drifter@mail.example · User · 1 session");
    expect(container).toHaveTextContent("Diary entries418");
    expect(container).toHaveTextContent("Followers · following88 · 131");
    expect(container).toHaveTextContent("Reports against5");
    expect(container).toHaveTextContent("By@glory42");
    expect(container).toHaveTextContent("Reasonharassment, 3 reports");
    expect(screen.getByText(/Firefox · Linux/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Lift suspension" })).toBeInTheDocument();
  });

  it("suspends for a chosen length with a reason, behind the admin's password", async () => {
    const user = userEvent.setup();
    let body: unknown = null;
    server.use(
      http.get("*/api/admin/users/reel_drifter", () => HttpResponse.json(detail({ isSuspended: false, suspendedAt: null, suspendedUntil: null, suspendedBy: null, suspendedReason: null }))),
      http.post("*/api/admin/users/reel_drifter/suspend", async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ success: true });
      }),
    );
    renderWithProviders(<AdminUserDetailPage username="reel_drifter" />, { queryClient: asAdmin() });

    await user.click(await screen.findByRole("button", { name: "Suspend…" }));
    await user.click(screen.getByRole("radio", { name: "7 days" }));
    await user.type(screen.getByLabelText(/Reason/), "Spam links");
    await user.type(screen.getByLabelText("Current password"), "admin-pass-1");
    await user.click(screen.getByRole("button", { name: "Suspend for 7 days" }));

    await vi.waitFor(() => expect(body).toEqual({ durationDays: 7, reason: "Spam links", adminPassword: "admin-pass-1" }));
  });

  it("offers no account actions on your own page", async () => {
    server.use(http.get("*/api/admin/users/glory42", () => HttpResponse.json(detail({ username: "glory42", id: "a1", isAdmin: true, isSuspended: false }))));
    renderWithProviders(<AdminUserDetailPage username="glory42" />, { queryClient: asAdmin() });

    expect(await screen.findByText("This is your account; act on it from Settings.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Suspend|Delete|Force reset/ })).not.toBeInTheDocument();
  });
});
