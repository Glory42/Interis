import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { server } from "../../../support/msw/server";
import { postKeys, useAddPostComment, useLikePost } from "@/features/posts/hooks/usePosts";
import { feedKeys } from "@/features/feed/hooks/useFeed";
import type { PostDetail } from "@/features/posts/api";
import type { FeedItem } from "@/features/feed/types";

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

const makeFeedItem = (postId: string, overrides: Partial<FeedItem> = {}): FeedItem =>
  ({
    id: `activity-${postId}`,
    type: "post",
    kind: "post",
    createdAt: "2026-01-01T00:00:00.000Z",
    actor: { id: "actor-1", username: "actor", displayUsername: null, avatarUrl: null },
    movie: null,
    post: { id: postId, content: "hello", likeCount: 0, commentCount: 0, viewerHasLiked: false },
    review: null,
    metadata: { postId },
    engagement: { likeCount: 0, commentCount: 0, viewerHasLiked: false },
    ...overrides,
  }) as unknown as FeedItem;

const makePostDetail = (postId: string, likeCount = 0): PostDetail =>
  ({
    id: postId,
    userId: "author-1",
    content: "hello",
    mediaId: null,
    mediaType: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    likeCount,
  }) as unknown as PostDetail;

describe("useLikePost", () => {
  it("optimistically patches both the feed item and the post detail cache", async () => {
    server.use(
      http.post("*/api/posts/post-1/like", async () => {
        await new Promise((resolve) => setTimeout(resolve, 20));
        return HttpResponse.json({ liked: true, wasNew: true });
      }),
    );

    const queryClient = createTestQueryClient();
    queryClient.setQueryData(feedKeys.following("all"), {
      pages: [{ items: [makeFeedItem("post-1")], nextCursor: null }],
      pageParams: [undefined],
    });
    queryClient.setQueryData(postKeys.detail("post-1"), makePostDetail("post-1", 0));

    const { result } = renderHook(() => useLikePost("post-1"), {
      wrapper: wrapperFor(queryClient),
    });

    result.current.mutate();

    await waitFor(() => {
      const feedData = queryClient.getQueryData(feedKeys.following("all")) as {
        pages: Array<{ items: FeedItem[] }>;
      };
      expect(feedData.pages[0]!.items[0]!.engagement.viewerHasLiked).toBe(true);
      expect(feedData.pages[0]!.items[0]!.engagement.likeCount).toBe(1);

      const detail = queryClient.getQueryData<PostDetail>(postKeys.detail("post-1"));
      expect(detail?.likeCount).toBe(1);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("rolls back both the feed item and the post detail cache on failure", async () => {
    server.use(
      http.post("*/api/posts/post-1/like", () =>
        HttpResponse.json({ error: "nope" }, { status: 400 }),
      ),
    );

    const queryClient = createTestQueryClient();
    queryClient.setQueryData(feedKeys.following("all"), {
      pages: [{ items: [makeFeedItem("post-1")], nextCursor: null }],
      pageParams: [undefined],
    });
    queryClient.setQueryData(postKeys.detail("post-1"), makePostDetail("post-1", 0));

    const { result } = renderHook(() => useLikePost("post-1"), {
      wrapper: wrapperFor(queryClient),
    });

    result.current.mutate();
    await waitFor(() => expect(result.current.isError).toBe(true));

    const feedData = queryClient.getQueryData(feedKeys.following("all")) as {
      pages: Array<{ items: FeedItem[] }>;
    };
    expect(feedData.pages[0]!.items[0]!.engagement.viewerHasLiked).toBe(false);
    expect(feedData.pages[0]!.items[0]!.engagement.likeCount).toBe(0);

    const detail = queryClient.getQueryData<PostDetail>(postKeys.detail("post-1"));
    expect(detail?.likeCount).toBe(0);
  });

  it("does not increment likeCount again if the feed item already showed viewerHasLiked (idempotent optimistic merge)", async () => {
    server.use(http.post("*/api/posts/post-1/like", () => HttpResponse.json({ liked: true })));

    const queryClient = createTestQueryClient();
    queryClient.setQueryData(feedKeys.following("all"), {
      pages: [
        {
          items: [makeFeedItem("post-1", { engagement: { likeCount: 1, commentCount: 0, viewerHasLiked: true } })],
          nextCursor: null,
        },
      ],
      pageParams: [undefined],
    });

    const { result } = renderHook(() => useLikePost("post-1"), {
      wrapper: wrapperFor(queryClient),
    });

    result.current.mutate();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const feedData = queryClient.getQueryData(feedKeys.following("all")) as {
      pages: Array<{ items: FeedItem[] }>;
    };
    expect(feedData.pages[0]!.items[0]!.engagement.likeCount).toBe(1);
  });
});

describe("useAddPostComment", () => {
  it("optimistically increments the feed item's commentCount and rolls back on failure", async () => {
    server.use(
      http.post("*/api/posts/post-1/comments", () =>
        HttpResponse.json({ error: "nope" }, { status: 400 }),
      ),
    );

    const queryClient = createTestQueryClient();
    queryClient.setQueryData(feedKeys.following("all"), {
      pages: [{ items: [makeFeedItem("post-1")], nextCursor: null }],
      pageParams: [undefined],
    });

    const { result } = renderHook(() => useAddPostComment("post-1"), {
      wrapper: wrapperFor(queryClient),
    });

    result.current.mutate({ content: "Nice post!" });

    await waitFor(() => {
      const feedData = queryClient.getQueryData(feedKeys.following("all")) as {
        pages: Array<{ items: FeedItem[] }>;
      };
      expect(feedData.pages[0]!.items[0]!.engagement.commentCount).toBe(1);
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    const feedData = queryClient.getQueryData(feedKeys.following("all")) as {
      pages: Array<{ items: FeedItem[] }>;
    };
    expect(feedData.pages[0]!.items[0]!.engagement.commentCount).toBe(0);
  });

  it("invalidates only this post's comments and the feed root on settle", async () => {
    server.use(
      http.post("*/api/posts/post-1/comments", () =>
        HttpResponse.json({
          id: "comment-1",
          userId: "user-1",
          postId: "post-1",
          content: "Nice post!",
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        }),
      ),
    );

    const queryClient = createTestQueryClient();
    queryClient.setQueryData(postKeys.comments("post-1"), []);
    queryClient.setQueryData(postKeys.comments("post-2"), []);
    queryClient.setQueryData(feedKeys.following("all"), {
      pages: [{ items: [makeFeedItem("post-1")], nextCursor: null }],
      pageParams: [undefined],
    });

    const { result } = renderHook(() => useAddPostComment("post-1"), {
      wrapper: wrapperFor(queryClient),
    });

    result.current.mutate({ content: "Nice post!" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(queryClient.getQueryState(postKeys.comments("post-1"))?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(feedKeys.following("all"))?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(postKeys.comments("post-2"))?.isInvalidated).toBe(false);
  });
});
