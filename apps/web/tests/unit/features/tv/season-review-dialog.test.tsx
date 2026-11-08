import { describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { server } from "../../../support/msw/server";
import type { MyTitleReview } from "@/features/reviews/api";
import {
  SeasonReviewDialog,
  type SeasonReviewTarget,
} from "@/features/tv/components/series-detail/SeasonReviewDialog";

const season = { seasonNumber: 2, name: "Season 2", posterPath: null };

const review: MyTitleReview = {
  id: "review-7",
  content: "The best season",
  containsSpoilers: false,
  diaryEntryId: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  rating: null,
  rewatch: null,
  watchedDate: null,
};

const interaction = {
  watched: true,
  liked: false,
  rating: null,
  onWatchedChange: vi.fn(),
  onLikedChange: vi.fn(),
  onRatingChange: vi.fn(),
};

const renderDialog = (target: SeasonReviewTarget, editingReview: MyTitleReview | null) => {
  const onClose = vi.fn();
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <SeasonReviewDialog
        tmdbId={1399}
        season={season}
        target={target}
        editingReview={editingReview}
        interaction={interaction}
        onClose={onClose}
      />
    </QueryClientProvider>,
  );
  return { onClose, user: userEvent.setup() };
};

describe("SeasonReviewDialog", () => {
  it("writes a new episode review", async () => {
    let body: unknown = null;
    server.use(
      http.post("*/api/serials/1399/seasons/2/episodes/5/review", async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ id: "review-8" });
      }),
    );
    const { onClose, user } = renderDialog({ type: "episode", episodeNumber: 5, episodeName: "The Pilot" }, null);

    expect(screen.getByRole("dialog", { name: "Review · TV · S02 · E05 · The Pilot" })).toBeInTheDocument();
    await user.type(screen.getByRole("textbox", { name: "Review" }), "  Tense  ");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(body).toEqual({ content: "Tense", containsSpoilers: false, createNew: true });
  });

  it("keeps the dialog open with an error when deleting fails", async () => {
    server.use(
      http.delete("*/api/serials/1399/seasons/2/review", () =>
        HttpResponse.json({ error: { message: "nope" } }, { status: 500 }),
      ),
    );
    const { onClose, user } = renderDialog({ type: "season" }, review);

    expect(screen.getByRole("textbox", { name: "Review" })).toHaveValue("The best season");
    await user.click(screen.getByRole("button", { name: "Delete review" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Could not delete the review. Please try again.");
    expect(onClose).not.toHaveBeenCalled();
  });
});
