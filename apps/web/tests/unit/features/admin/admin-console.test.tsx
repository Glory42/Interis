import { describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient } from "@tanstack/react-query";
import { server } from "../../../support/msw/server";
import { renderWithProviders } from "../../../support/render/render-with-providers";
import { authKeys } from "@/features/auth/hooks/useAuth";
import { AdminShell } from "@/features/admin/components/AdminShell";
import { AdminOverviewPage } from "@/features/admin/components/AdminOverviewPage";
import { AdminContentPage } from "@/features/admin/components/AdminContentPage";

const asAdmin = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  queryClient.setQueryData(authKeys.me, { id: "a1", username: "glory42", isAdmin: true });
  return queryClient;
};

const overview = {
  computedAt: "2026-11-06T19:42:00.000Z",
  needsYou: { pendingReports: 7, oldestPendingAt: "2026-11-03T15:42:00.000Z", reportedItems: 4, suspensionsEndingSoon: 2 },
  lastSevenDays: { newAccounts: 41, diaryEntries: 1286, reviews: 312, posts: 96, comments: 233 },
  cache: { films: 10412, series: 2207 },
  latestActions: [{ action: "user.suspend", targetLabel: "freestreamz", actorUsername: "glory42", createdAt: "2026-11-06T19:30:00.000Z" }],
};

describe("AdminShell", () => {
  it("navigates with real, linkable routes", async () => {
    renderWithProviders(<AdminShell>panel</AdminShell>, { routePath: "/admin/users", queryClient: asAdmin() });

    expect(await screen.findByText("Interis · Admin · @glory42")).toBeInTheDocument();
    const nav = screen.getByRole("navigation", { name: "Admin sections" });
    expect(within(nav).getByRole("link", { name: "Overview" })).toHaveAttribute("href", "/admin");
    expect(within(nav).getByRole("link", { name: "Reports" })).toHaveAttribute("href", "/admin/reports");
    expect(within(nav).getByRole("link", { name: "Users" })).toHaveAttribute("aria-current", "page");
    expect(within(nav).getByRole("link", { name: "Content" })).toHaveAttribute("href", "/admin/content");
  });
});

describe("AdminOverviewPage", () => {
  it("reads as one credits block and refreshes only when asked", async () => {
    const user = userEvent.setup();
    let requests = 0;
    server.use(
      http.get("*/api/admin/overview", () => {
        requests += 1;
        return HttpResponse.json(overview);
      }),
    );
    const { container } = renderWithProviders(<AdminOverviewPage />, { queryClient: asAdmin() });

    expect(await screen.findByText("7 · oldest 3d 4h")).toBeInTheDocument();
    expect(container).toHaveTextContent("Reported items4");
    expect(container).toHaveTextContent("Suspensions ending ≤ 7d2");
    expect(container).toHaveTextContent("Diary entries1,286");
    expect(container).toHaveTextContent("Posts · comments96 · 233");
    expect(container).toHaveTextContent("Cached films · series10,412 · 2,207");
    expect(screen.getByText(/user\.suspend/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open the report queue →" })).toHaveAttribute("href", "/admin/reports");

    await user.click(screen.getByRole("button", { name: "↻ Refresh" }));
    await vi.waitFor(() => expect(requests).toBe(2));
  });
});

describe("AdminContentPage", () => {
  it("shows one kind of content at a time, picked from a sentence", async () => {
    const user = userEvent.setup();
    server.use(http.get("*/api/admin/reviews", () => HttpResponse.json([])));
    const onTypeChange = vi.fn();
    renderWithProviders(<AdminContentPage type="reviews" onTypeChange={onTypeChange} />, { queryClient: asAdmin() });

    expect(await screen.findByRole("heading", { name: "Reviews" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /reviews/ }));
    await user.click(screen.getByRole("menuitemradio", { name: "Posts" }));
    expect(onTypeChange).toHaveBeenCalledWith("posts");
  });
});
