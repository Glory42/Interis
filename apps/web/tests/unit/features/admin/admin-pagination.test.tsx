import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { server } from "../../../support/msw/server";
import { AdminReportsPanel } from "@/features/admin/components/AdminReportsPanel";
import { AdminReviewsPanel } from "@/features/admin/components/AdminReviewsPanel";

const renderWithQueryClient = (ui: ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
};

const review = (n: number) => ({
  id: `review-${n}`,
  userId: `user-${n}`,
  authorUsername: `critic${n}`,
  mediaType: "movie",
  movieId: 1,
  movieTitle: "Clayface",
  content: `Review number ${n}`,
  containsSpoilers: false,
  createdAt: "2026-11-02T12:00:00.000Z",
});

const report = (n: number) => ({
  id: `report-${n}`,
  reporterId: `reporter-${n}`,
  reporterUsername: `reporter${n}`,
  targetType: "review",
  targetId: `review-${n}`,
  contentSnapshot: `Reported text ${n}`,
  reason: "spam",
  details: null,
  status: "pending",
  createdAt: "2026-11-02T12:00:00.000Z",
  resolvedAt: null,
});

const pagesBy = (pages: Record<string, unknown[]>) => {
  const offsets: string[] = [];
  return {
    offsets,
    handler: (url: string) =>
      http.get(url, ({ request }) => {
        const offset = new URL(request.url).searchParams.get("offset") ?? "0";
        offsets.push(offset);
        return HttpResponse.json(pages[offset] ?? []);
      }),
  };
};

describe("admin list pagination", () => {
  it("loads the next page of reviews and stops when a page comes back short", async () => {
    const user = userEvent.setup();
    const firstPage = Array.from({ length: 20 }, (_, i) => review(i + 1));
    const secondPage = [review(21), review(22)];
    const fake = pagesBy({ "0": firstPage, "20": secondPage });
    server.use(fake.handler("http://localhost/api/admin/reviews"));

    renderWithQueryClient(<AdminReviewsPanel />);

    expect(await screen.findByText("Review number 20")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Load more" }));

    expect(await screen.findByText("Review number 22")).toBeInTheDocument();
    expect(screen.getAllByText(/^Review number \d+$/)).toHaveLength(22);
    expect(screen.queryByRole("button", { name: "Load more" })).not.toBeInTheDocument();
    expect(fake.offsets).toEqual(["0", "20"]);
  });

  it("reaches pending reports beyond the first 20", async () => {
    const user = userEvent.setup();
    const fake = pagesBy({
      "0": Array.from({ length: 20 }, (_, i) => report(i + 1)),
      "20": [report(21)],
    });
    server.use(fake.handler("http://localhost/api/reports"));

    renderWithQueryClient(<AdminReportsPanel status="pending" onStatusChange={() => {}} />);

    expect(await screen.findByText("Reported text 20")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Load more" }));

    expect(await screen.findByText("Reported text 21")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Load more" })).not.toBeInTheDocument();
  });
});
