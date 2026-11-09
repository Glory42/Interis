import { describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { QueryClient } from "@tanstack/react-query";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { server } from "../../../support/msw/server";
import { renderWithProviders } from "../../../support/render/render-with-providers";
import { ReviewOwnerEditDialog } from "@/features/reviews/components/profile-review-detail/ReviewOwnerEditDialog";
import { reviewKeys } from "@/features/reviews/hooks/review-keys";
import type { ReviewDetail } from "@/features/reviews/api";

const detail = (overrides: Partial<ReviewDetail> = {}): ReviewDetail => ({
  id: "r1",
  mediaType: "movie",
  content: "LETS GO",
  containsSpoilers: false,
  createdAt: "2026-11-02T21:40:00",
  updatedAt: "2026-11-02T21:40:00",
  rating: 8,
  log: { id: "entry-1", watchedDate: "2026-11-01", rating: 8, rewatch: false },
  author: { id: "u1", username: "cinefan", displayUsername: null, avatarUrl: null } as ReviewDetail["author"],
  media: { tmdbId: 550, title: "Fight Club", posterPath: null, releaseYear: 1999, genres: [], director: null, creator: null },
  engagement: { likeCount: 0, commentCount: 0, viewerHasLiked: false },
  ...overrides,
});

const newQueryClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });

describe("ReviewOwnerEditDialog", () => {
  it("edits the whole log of a review written with one, and refreshes the review", async () => {
    let sent: unknown = null;
    server.use(
      http.get("*/api/interactions/:tmdbId", () =>
        HttpResponse.json({ liked: false, watchlisted: false, rating: 8, watched: true }),
      ),
      http.put("*/api/diary/:id", async ({ request }) => {
        sent = await request.json();
        return HttpResponse.json({ id: "entry-1", review: null });
      }),
    );
    const queryClient = newQueryClient();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<ReviewOwnerEditDialog detail={detail()} username="cinefan" isOpen onClose={onClose} />, {
      queryClient,
    });

    expect(await screen.findByRole("dialog", { name: /^Edit log/ })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Review" })).toHaveValue("LETS GO");
    await user.click(screen.getByRole("button", { name: /First watch/ }));
    await user.click(screen.getByRole("switch", { name: "Contains spoilers" }));
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(sent).toEqual({ rewatch: true, containsSpoilers: true });
    const reviewRefresh = invalidate.mock.calls.find(([filters]) => filters?.queryKey === reviewKeys.detailRoot);
    expect(reviewRefresh?.[0]?.predicate?.({ queryKey: reviewKeys.detail("cinefan", "r1") } as never)).toBe(true);
    expect(reviewRefresh?.[0]?.predicate?.({ queryKey: reviewKeys.detail("cinefan", "r2") } as never)).toBe(false);
  });

  it("edits only the text and spoiler flag of a standalone review", async () => {
    renderWithProviders(
      <ReviewOwnerEditDialog detail={detail({ log: null })} username="cinefan" isOpen onClose={() => {}} />,
      { queryClient: newQueryClient() },
    );

    expect(await screen.findByText("EDIT REVIEW")).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: "Contains spoilers" })).toHaveAttribute("aria-checked", "false");
    expect(screen.queryByRole("button", { name: /First watch/ })).not.toBeInTheDocument();
  });
});
