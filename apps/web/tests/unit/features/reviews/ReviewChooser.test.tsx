import { describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, renderHook, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { server } from "../../../support/msw/server";
import type { MyTitleReview } from "@/features/reviews/api";
import { ReviewChooserDialog } from "@/features/reviews/components/ReviewChooserDialog";
import { useReviewChooser } from "@/features/reviews/hooks/useReviewChooser";

const buildReview = (overrides: Partial<MyTitleReview> = {}): MyTitleReview => ({
  id: "review-1",
  content: "Didn't get it",
  containsSpoilers: false,
  diaryEntryId: "entry-1",
  createdAt: "2026-01-02T00:00:00.000Z",
  updatedAt: "2026-01-02T00:00:00.000Z",
  rating: 6,
  watchedDate: "2026-01-01",
  ...overrides,
});

const renderChooser = (reviews: MyTitleReview[]) => {
  const handlers = { onWriteNew: vi.fn(), onEdit: vi.fn(), onClose: vi.fn() };
  render(
    <ReviewChooserDialog
      reviews={reviews}
      title="Your reviews"
      writeNewLabel="Write a new review"
      {...handlers}
    />,
  );
  return handlers;
};

describe("ReviewChooserDialog", () => {
  it("edits the only review straight from the chooser", async () => {
    const user = userEvent.setup();
    const review = buildReview();
    const handlers = renderChooser([review]);

    await user.click(screen.getByRole("button", { name: /edit your review from jan 1, 2026/i }));
    expect(handlers.onEdit).toHaveBeenCalledWith(review);

    await user.click(screen.getByRole("button", { name: /write a new review/i }));
    expect(handlers.onWriteNew).toHaveBeenCalledTimes(1);
  });

  it("lists several reviews to pick from, with date, rating and a preview", async () => {
    const user = userEvent.setup();
    const older = buildReview();
    const newer = buildReview({
      id: "review-2",
      content: "Now I get it",
      rating: 9,
      watchedDate: "2026-03-01",
    });
    const handlers = renderChooser([newer, older]);

    await user.click(screen.getByRole("button", { name: /edit an existing review \(2\)/i }));

    const pick = screen.getByRole("button", { name: /mar 1, 2026.*9\/10.*now i get it/i });
    expect(screen.getByRole("button", { name: /jan 1, 2026.*6\/10.*didn't get it/i })).toBeTruthy();
    await user.click(pick);
    expect(handlers.onEdit).toHaveBeenCalledWith(newer);
  });

  it("renders nothing until there are reviews to choose from", () => {
    const { container } = render(
      <ReviewChooserDialog
        reviews={null}
        title="Your reviews"
        writeNewLabel="Write a new review"
        onWriteNew={vi.fn()}
        onEdit={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(container.innerHTML).toBe("");
    expect(screen.queryByRole("button")).toBeNull();
  });
});

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    {children}
  </QueryClientProvider>
);

describe("useReviewChooser", () => {
  it("goes straight to writing when the title has no review yet", async () => {
    server.use(http.get("*/api/reviews/mine", () => HttpResponse.json([])));
    const onWriteNew = vi.fn();
    const { result } = renderHook(() => useReviewChooser(), { wrapper });

    act(() => result.current.start({ mediaType: "movie", tmdbId: 550 }, onWriteNew));

    await waitFor(() => expect(onWriteNew).toHaveBeenCalledTimes(1));
    expect(result.current.reviews).toBeNull();
  });

  it("opens the chooser with the viewer's reviews of that title", async () => {
    let requestedUrl = "";
    server.use(
      http.get("*/api/reviews/mine", ({ request }) => {
        requestedUrl = request.url;
        return HttpResponse.json([buildReview()]);
      }),
    );
    const onWriteNew = vi.fn();
    const { result } = renderHook(() => useReviewChooser(), { wrapper });

    act(() =>
      result.current.start({ mediaType: "tv_season", tmdbId: 1399, seasonNumber: 2 }, onWriteNew),
    );

    await waitFor(() => expect(result.current.reviews).toHaveLength(1));
    expect(Object.fromEntries(new URL(requestedUrl).searchParams)).toEqual({
      mediaType: "tv_season",
      tmdbId: "1399",
      seasonNumber: "2",
    });
    expect(onWriteNew).not.toHaveBeenCalled();

    act(() => result.current.writeNew());
    expect(onWriteNew).toHaveBeenCalledTimes(1);
    expect(result.current.reviews).toBeNull();
  });

  it("falls back to writing a new review when the list can't load", async () => {
    server.use(http.get("*/api/reviews/mine", () => HttpResponse.json({}, { status: 500 })));
    const onWriteNew = vi.fn();
    const { result } = renderHook(() => useReviewChooser(), { wrapper });

    act(() => result.current.start({ mediaType: "movie", tmdbId: 550 }, onWriteNew));

    await waitFor(() => expect(onWriteNew).toHaveBeenCalledTimes(1));
  });
});
