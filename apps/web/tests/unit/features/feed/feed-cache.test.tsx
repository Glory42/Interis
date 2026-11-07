import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { server } from "../../../support/msw/server";
import {
  activity,
  makeFeedItem,
  makeTitleGroup,
  readGroupedFeed,
  seedGroupedFeed,
} from "../../../support/fixtures/grouped-feed";
import { patchFeed } from "@/features/feed/hooks/feed-cache";
import { feedKeys } from "@/features/feed/hooks/useFeed";
import type { FeedItem, FeedTitleGroup, GroupedFeedEntry } from "@/features/feed/types";
import {
  useAddReviewComment,
  useDeleteReviewComment,
  useLikeReview,
  useUnlikeReview,
  useUpdateReview,
  useUpdateReviewComment,
} from "@/features/reviews/hooks/useReviews";
import { useDeleteReview } from "@/features/reviews/hooks/useDeleteReview";
import {
  useAddPostComment,
  useLikePost,
  useUnlikePost,
  useUpdatePost,
  useUpdatePostComment,
} from "@/features/posts/hooks/usePosts";

const setup = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, wrapper };
};

const review = { id: "review-1", content: "Old take", containsSpoilers: false, rating: 8 };
const engagement = { likeCount: 2, commentCount: 1, viewerHasLiked: false };

// Review 1 shows three times: a title card, a like of it and a comment on it.
const reviewFeed = (): GroupedFeedEntry[][] => [
  [
    makeTitleGroup({ review, engagement }),
    activity(makeFeedItem({ id: "unrelated", review: { ...review, id: "review-2" }, engagement })),
  ],
  [
    activity(
      makeFeedItem({
        id: "liked",
        type: "liked_review",
        kind: "liked_review",
        engagement,
        metadata: { reviewId: "review-1", excerpt: "Old take" },
      }),
    ),
    activity(
      makeFeedItem({
        id: "commented",
        type: "commented",
        kind: "commented",
        review,
        engagement,
        metadata: { reviewId: "review-1", commentId: "comment-1", excerpt: "A comment" },
      }),
    ),
  ],
];

const group = (entries: GroupedFeedEntry[]) => entries[0] as FeedTitleGroup;
const item = (entries: GroupedFeedEntry[], id: string): FeedItem | undefined =>
  entries.flatMap((entry) => (entry.kind === "activity" ? [entry.item] : [])).find((it) => it.id === id);

const slow = (body: unknown) => async () => {
  await new Promise((resolve) => setTimeout(resolve, 150));
  return HttpResponse.json(body);
};
const fail = () => HttpResponse.json({ error: "nope" }, { status: 500 });

describe("feed cache: Review changes", () => {
  it("likes the review everywhere it shows, in every filter, before the request settles", async () => {
    server.use(http.post("*/api/reviews/review-1/like", slow({ liked: true })));
    const { queryClient, wrapper } = setup();
    seedGroupedFeed(queryClient, reviewFeed(), "all");
    seedGroupedFeed(queryClient, reviewFeed(), "movie");

    const { result } = renderHook(() => useLikeReview("review-1"), { wrapper });
    result.current.mutate();

    await waitFor(() => expect(group(readGroupedFeed(queryClient)).engagement.viewerHasLiked).toBe(true));
    for (const filter of ["all", "movie"] as const) {
      const entries = readGroupedFeed(queryClient, filter);
      expect(group(entries).engagement).toEqual({ likeCount: 3, commentCount: 1, viewerHasLiked: true });
      expect(item(entries, "liked")?.engagement.likeCount).toBe(3);
      expect(item(entries, "commented")?.engagement.likeCount).toBe(3);
      expect(item(entries, "unrelated")?.engagement).toEqual(engagement);
    }

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const state = queryClient.getQueryState(feedKeys.grouped("all"));
    expect(state?.isInvalidated).toBe(true);
  });

  it("rolls the like back when the request fails", async () => {
    server.use(http.post("*/api/reviews/review-1/like", fail));
    const { queryClient, wrapper } = setup();
    const seeded = seedGroupedFeed(queryClient, reviewFeed());

    const { result } = renderHook(() => useLikeReview("review-1"), { wrapper });
    result.current.mutate();
    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(readGroupedFeed(queryClient)).toEqual(seeded.pages.flatMap((page) => page.items));
  });

  it("unlikes, and rolls back on failure", async () => {
    server.use(http.delete("*/api/reviews/review-1/like", async () => {
      await new Promise((resolve) => setTimeout(resolve, 150));
      return fail();
    }));
    const { queryClient, wrapper } = setup();
    const liked = { ...engagement, likeCount: 3, viewerHasLiked: true };
    seedGroupedFeed(queryClient, [[makeTitleGroup({ review, engagement: liked })]]);

    const { result } = renderHook(() => useUnlikeReview("review-1"), { wrapper });
    result.current.mutate();

    await waitFor(() =>
      expect(group(readGroupedFeed(queryClient)).engagement).toEqual({ ...liked, likeCount: 2, viewerHasLiked: false }),
    );
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(group(readGroupedFeed(queryClient)).engagement).toEqual(liked);
  });

  it("counts a new comment and a removed one", async () => {
    server.use(
      http.post("*/api/reviews/review-1/comments", () =>
        HttpResponse.json({
          id: "comment-9",
          reviewId: "review-1",
          userId: "u",
          content: "Hi",
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
          authorUsername: "u",
          authorDisplayUsername: null,
          authorAvatarUrl: null,
        }),
      ),
      http.delete("*/api/reviews/comments/comment-9", () => HttpResponse.json({ success: true })),
    );
    const { queryClient, wrapper } = setup();
    seedGroupedFeed(queryClient, reviewFeed());

    const add = renderHook(() => useAddReviewComment("review-1", "movie"), { wrapper });
    await act(() => add.result.current.mutateAsync({ content: "Hi" }));
    expect(group(readGroupedFeed(queryClient)).engagement.commentCount).toBe(2);
    expect(item(readGroupedFeed(queryClient), "liked")?.engagement.commentCount).toBe(2);

    const remove = renderHook(() => useDeleteReviewComment("review-1", "movie"), { wrapper });
    await act(() => remove.result.current.mutateAsync("comment-9"));
    expect(group(readGroupedFeed(queryClient)).engagement.commentCount).toBe(1);
  });

  it("shows the edited review text on the title card and the review's excerpts", async () => {
    server.use(
      http.put("*/api/reviews/review-1", () =>
        HttpResponse.json({ id: "review-1", content: "New take", containsSpoilers: true, updatedAt: "2026-01-02T00:00:00.000Z" }),
      ),
    );
    const { queryClient, wrapper } = setup();
    seedGroupedFeed(queryClient, reviewFeed());

    const { result } = renderHook(() => useUpdateReview("review-1"), { wrapper });
    await act(() => result.current.mutateAsync({ content: "New take", containsSpoilers: true }));

    const entries = readGroupedFeed(queryClient);
    expect(group(entries).review).toMatchObject({ content: "New take", containsSpoilers: true });
    expect(item(entries, "liked")?.metadata).toMatchObject({ excerpt: "New take", containsSpoilers: true });
    // A comment activity's excerpt is the comment, not the review.
    expect(item(entries, "commented")?.metadata.excerpt).toBe("A comment");
    expect(item(entries, "commented")?.review?.content).toBe("New take");
    expect(item(entries, "unrelated")?.review?.content).toBe("Old take");
  });

  it("shows an edited comment's new text", async () => {
    server.use(
      http.put("*/api/reviews/comments/comment-1", () =>
        HttpResponse.json({
          id: "comment-1",
          reviewId: "review-1",
          userId: "u",
          content: "Edited comment",
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-02T00:00:00.000Z",
          authorUsername: "u",
          authorDisplayUsername: null,
          authorAvatarUrl: null,
        }),
      ),
    );
    const { queryClient, wrapper } = setup();
    seedGroupedFeed(queryClient, reviewFeed());

    const { result } = renderHook(() => useUpdateReviewComment("review-1", "movie"), { wrapper });
    await act(() => result.current.mutateAsync({ commentId: "comment-1", content: "Edited comment" }));

    expect(item(readGroupedFeed(queryClient), "commented")?.metadata.excerpt).toBe("Edited comment");
  });

  it("drops a deleted review: off the title card, and its like and comment activities gone", async () => {
    server.use(http.delete("*/api/reviews/review-1", () => HttpResponse.json({ success: true })));
    const { queryClient, wrapper } = setup();
    seedGroupedFeed(queryClient, reviewFeed());

    const { result } = renderHook(() => useDeleteReview(), { wrapper });
    await act(() => result.current.mutateAsync({ id: "review-1", mediaType: "movie", tmdbId: 550 }));

    const entries = readGroupedFeed(queryClient);
    expect(group(entries).review).toBeNull();
    expect(item(entries, "liked")).toBeUndefined();
    expect(item(entries, "commented")).toBeUndefined();
    expect(item(entries, "unrelated")).toBeDefined();
  });
});

const post = { id: "post-1", content: "Old post", mediaId: null, mediaType: null };
const postFeed = (): GroupedFeedEntry[][] => [
  [
    activity(makeFeedItem({ id: "post", type: "post", kind: "post", movie: null, post, engagement, metadata: { postId: "post-1", excerpt: "Old post" } })),
    activity(
      makeFeedItem({
        id: "post-comment",
        type: "commented",
        kind: "commented_post",
        movie: null,
        post,
        engagement,
        metadata: { postId: "post-1", commentId: "pc-1", excerpt: "A reply" },
      }),
    ),
  ],
];

describe("feed cache: Post changes", () => {
  it("likes and unlikes a post", async () => {
    server.use(
      http.post("*/api/posts/post-1/like", () => HttpResponse.json({ liked: true })),
      http.delete("*/api/posts/post-1/like", () => HttpResponse.json({ liked: false })),
    );
    const { queryClient, wrapper } = setup();
    seedGroupedFeed(queryClient, postFeed());

    const like = renderHook(() => useLikePost("post-1"), { wrapper });
    await act(() => like.result.current.mutateAsync());
    expect(item(readGroupedFeed(queryClient), "post")?.engagement).toMatchObject({ likeCount: 3, viewerHasLiked: true });
    expect(item(readGroupedFeed(queryClient), "post-comment")?.engagement.likeCount).toBe(3);

    const unlike = renderHook(() => useUnlikePost("post-1"), { wrapper });
    await act(() => unlike.result.current.mutateAsync());
    expect(item(readGroupedFeed(queryClient), "post")?.engagement).toMatchObject({ likeCount: 2, viewerHasLiked: false });
  });

  it("counts a comment optimistically and rolls it back on failure", async () => {
    server.use(http.post("*/api/posts/post-1/comments", async () => {
      await new Promise((resolve) => setTimeout(resolve, 150));
      return fail();
    }));
    const { queryClient, wrapper } = setup();
    seedGroupedFeed(queryClient, postFeed());

    const { result } = renderHook(() => useAddPostComment("post-1"), { wrapper });
    result.current.mutate({ content: "Hi" });

    await waitFor(() => expect(item(readGroupedFeed(queryClient), "post")?.engagement.commentCount).toBe(2));
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(item(readGroupedFeed(queryClient), "post")?.engagement.commentCount).toBe(1);
  });

  it("shows an edited post and an edited post comment", async () => {
    server.use(
      http.put("*/api/posts/post-1", () => HttpResponse.json({ ...post, content: "New post", userId: "u", createdAt: "x", updatedAt: "y" })),
      http.put("*/api/posts/comments/pc-1", () =>
        HttpResponse.json({ id: "pc-1", userId: "u", postId: "post-1", content: "New reply", createdAt: "x", updatedAt: "y" }),
      ),
    );
    const { queryClient, wrapper } = setup();
    seedGroupedFeed(queryClient, postFeed());

    const edit = renderHook(() => useUpdatePost("post-1"), { wrapper });
    await act(() => edit.result.current.mutateAsync({ content: "New post" }));
    const editComment = renderHook(() => useUpdatePostComment("post-1"), { wrapper });
    await act(() => editComment.result.current.mutateAsync({ commentId: "pc-1", content: "New reply" }));

    const entries = readGroupedFeed(queryClient);
    expect(item(entries, "post")?.post?.content).toBe("New post");
    expect(item(entries, "post")?.metadata.excerpt).toBe("New post");
    expect(item(entries, "post-comment")?.post?.content).toBe("New post");
    expect(item(entries, "post-comment")?.metadata.excerpt).toBe("New reply");
  });
});

describe("patchFeed", () => {
  it("is a no-op with nothing cached", async () => {
    const { queryClient } = setup();
    await expect(patchFeed(queryClient, { review: "review-1" }, { type: "liked" })).resolves.toEqual([]);
  });

  it("trims a patched excerpt like the API does", async () => {
    const { queryClient } = setup();
    seedGroupedFeed(queryClient, reviewFeed());
    await patchFeed(queryClient, { review: "review-1" }, { type: "review-edited", content: "x".repeat(300), containsSpoilers: false });
    expect(item(readGroupedFeed(queryClient), "liked")?.metadata.excerpt).toHaveLength(120);
  });
});
