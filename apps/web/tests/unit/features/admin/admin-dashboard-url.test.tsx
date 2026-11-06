import { describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { server } from "../../../support/msw/server";
import { AdminDashboardPage } from "@/features/admin/components/AdminDashboardPage";

const renderWithQueryClient = (ui: ReactElement) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
};

describe("admin dashboard URL state", () => {
  it("shows the section named in the URL and reports section changes", async () => {
    const user = userEvent.setup();
    server.use(http.get("http://localhost/api/admin/reviews", () => HttpResponse.json([])));
    const onSearchChange = vi.fn();

    renderWithQueryClient(
      <AdminDashboardPage
        search={{ section: "reviews", status: "pending" }}
        onSearchChange={onSearchChange}
      />,
    );

    expect(await screen.findByRole("heading", { name: "Reviews" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^Users$/ }));
    expect(onSearchChange).toHaveBeenCalledWith({ section: "users", status: "pending" });
  });

  it("loads reports for the status in the URL and reports status changes", async () => {
    const user = userEvent.setup();
    const statuses: (string | null)[] = [];
    server.use(
      http.get("http://localhost/api/reports", ({ request }) => {
        statuses.push(new URL(request.url).searchParams.get("status"));
        return HttpResponse.json([]);
      }),
    );
    const onSearchChange = vi.fn();

    renderWithQueryClient(
      <AdminDashboardPage
        search={{ section: "reports", status: "dismissed" }}
        onSearchChange={onSearchChange}
      />,
    );

    await waitFor(() => expect(statuses).toContain("dismissed"));
    await user.click(screen.getByRole("button", { name: /resolved/i }));
    expect(onSearchChange).toHaveBeenCalledWith({ section: "reports", status: "resolved" });
  });
});
