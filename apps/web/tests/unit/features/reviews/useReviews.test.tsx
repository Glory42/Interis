import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { server } from "../../../support/msw/server";
import { reviewKeys, useLikeReview } from "@/features/reviews/hooks/useReviews";
import type { ReviewDetail } from "@/features/reviews/api";

const createTestQueryClient = (): QueryClient =>
  new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

const wrapperFor = (queryClient: QueryClient) => {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return Wrapper;
};

const makeReviewDetail = (id: string, overrides: Partial<ReviewDetail> = {}): ReviewDetail =>
  ({
    id,
    mediaType: "movie",
    content: "Great film",
    containsSpoilers: false,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    rating: 8,
    author: { id: "author-1", username: "author", displayUsername: null, avatarUrl: null },
    media: {
      tmdbId: 550,
      title: "Fight Club",
      posterPath: null,
      releaseYear: 1999,
      genres: [],
      director: null,
      creator: null,
    },
    engagement: { likeCount: 0, commentCount: 0, viewerHasLiked: false },
    ...overrides,
  }) as unknown as ReviewDetail;

describe("useLikeReview", () => {
  it("optimistically patches every cached detail-query variant for this reviewId, across different usernames in the key", async () => {
    server.use(
      http.post("*/api/reviews/review-1/like", async () => {
        await new Promise((resolve) => setTimeout(resolve, 20));
        return HttpResponse.json({ liked: true });
      }),
    );

    const queryClient = createTestQueryClient();
    // Two cached detail queries for the same reviewId under different
    // usernames in the key - patchReviewDetailQueries must update both.
    queryClient.setQueryData(reviewKeys.detail("alice", "review-1"), makeReviewDetail("review-1"));
    queryClient.setQueryData(reviewKeys.detail("bob", "review-1"), makeReviewDetail("review-1"));
    // A different review's cache must never be touched.
    queryClient.setQueryData(
      reviewKeys.detail("alice", "review-2"),
      makeReviewDetail("review-2"),
    );

    const { result } = renderHook(() => useLikeReview("review-1"), {
      wrapper: wrapperFor(queryClient),
    });

    result.current.mutate();

    await waitFor(() => {
      const aliceDetail = queryClient.getQueryData<ReviewDetail>(
        reviewKeys.detail("alice", "review-1"),
      );
      const bobDetail = queryClient.getQueryData<ReviewDetail>(
        reviewKeys.detail("bob", "review-1"),
      );
      expect(aliceDetail?.engagement.viewerHasLiked).toBe(true);
      expect(aliceDetail?.engagement.likeCount).toBe(1);
      expect(bobDetail?.engagement.viewerHasLiked).toBe(true);
      expect(bobDetail?.engagement.likeCount).toBe(1);
    });

    const otherReview = queryClient.getQueryData<ReviewDetail>(
      reviewKeys.detail("alice", "review-2"),
    );
    expect(otherReview?.engagement.likeCount).toBe(0);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("rolls back every patched detail-query variant on failure", async () => {
    server.use(
      http.post("*/api/reviews/review-1/like", () =>
        HttpResponse.json({ error: "nope" }, { status: 400 }),
      ),
    );

    const queryClient = createTestQueryClient();
    queryClient.setQueryData(reviewKeys.detail("alice", "review-1"), makeReviewDetail("review-1"));
    queryClient.setQueryData(reviewKeys.detail("bob", "review-1"), makeReviewDetail("review-1"));

    const { result } = renderHook(() => useLikeReview("review-1"), {
      wrapper: wrapperFor(queryClient),
    });

    result.current.mutate();
    await waitFor(() => expect(result.current.isError).toBe(true));

    const aliceDetail = queryClient.getQueryData<ReviewDetail>(
      reviewKeys.detail("alice", "review-1"),
    );
    const bobDetail = queryClient.getQueryData<ReviewDetail>(
      reviewKeys.detail("bob", "review-1"),
    );
    expect(aliceDetail?.engagement.viewerHasLiked).toBe(false);
    expect(aliceDetail?.engagement.likeCount).toBe(0);
    expect(bobDetail?.engagement.viewerHasLiked).toBe(false);
    expect(bobDetail?.engagement.likeCount).toBe(0);
  });

  it("does not double-increment likeCount when the cached detail already showed viewerHasLiked", async () => {
    server.use(http.post("*/api/reviews/review-1/like", () => HttpResponse.json({ liked: true })));

    const queryClient = createTestQueryClient();
    queryClient.setQueryData(
      reviewKeys.detail("alice", "review-1"),
      makeReviewDetail("review-1", {
        engagement: { likeCount: 3, commentCount: 0, viewerHasLiked: true },
      }),
    );

    const { result } = renderHook(() => useLikeReview("review-1"), {
      wrapper: wrapperFor(queryClient),
    });

    result.current.mutate();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const detail = queryClient.getQueryData<ReviewDetail>(
      reviewKeys.detail("alice", "review-1"),
    );
    expect(detail?.engagement.likeCount).toBe(3);
  });
});
