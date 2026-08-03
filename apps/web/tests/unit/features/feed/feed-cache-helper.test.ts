import { describe, expect, it } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import { patchFeedItems } from "@/features/feed/hooks/feed-cache.helper";
import { feedKeys } from "@/features/feed/hooks/useFeed";
import { restoreQueries } from "@/lib/query-optimistic";
import type { FeedItem } from "@/features/feed/types";

const makeItem = (id: string, overrides: Partial<FeedItem> = {}): FeedItem =>
  ({
    id,
    type: "post",
    kind: "post",
    createdAt: "2026-01-01T00:00:00.000Z",
    actor: { id: "actor-1", username: "actor", displayUsername: null, avatarUrl: null },
    movie: null,
    post: { id: `post-${id}`, content: "hello", likeCount: 0, commentCount: 0, viewerHasLiked: false },
    review: null,
    metadata: {},
    engagement: { likeCount: 0, commentCount: 0, viewerHasLiked: null },
    ...overrides,
  }) as unknown as FeedItem;

describe("patchFeedItems", () => {
  it("patches matching items across every cached page of every filter variant", () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(feedKeys.following("all"), {
      pages: [{ items: [makeItem("a"), makeItem("b")], nextCursor: null }],
      pageParams: [undefined],
    });
    queryClient.setQueryData(feedKeys.following("movie"), {
      pages: [
        { items: [makeItem("a")], nextCursor: "cursor-1" },
        { items: [makeItem("c")], nextCursor: null },
      ],
      pageParams: [undefined, "cursor-1"],
    });

    patchFeedItems(
      queryClient,
      (item) => item.id === "a",
      (item) => ({ ...item, engagement: { ...item.engagement, likeCount: 99 } }),
    );

    const allData = queryClient.getQueryData(feedKeys.following("all")) as {
      pages: Array<{ items: FeedItem[] }>;
    };
    expect(allData.pages[0]!.items[0]!.engagement.likeCount).toBe(99);
    expect(allData.pages[0]!.items[1]!.engagement.likeCount).toBe(0);

    const movieData = queryClient.getQueryData(feedKeys.following("movie")) as {
      pages: Array<{ items: FeedItem[] }>;
    };
    expect(movieData.pages[0]!.items[0]!.engagement.likeCount).toBe(99);
    expect(movieData.pages[1]!.items[0]!.engagement.likeCount).toBe(0);
  });

  it("leaves items untouched when nothing matches", () => {
    const queryClient = new QueryClient();
    const original = { pages: [{ items: [makeItem("a")], nextCursor: null }], pageParams: [undefined] };
    queryClient.setQueryData(feedKeys.following("all"), original);

    patchFeedItems(
      queryClient,
      (item) => item.id === "does-not-exist",
      (item) => ({ ...item, engagement: { ...item.engagement, likeCount: 99 } }),
    );

    const data = queryClient.getQueryData(feedKeys.following("all"));
    expect(data).toEqual(original);
  });

  it("does not throw when there is no cached feed data yet", () => {
    const queryClient = new QueryClient();
    expect(() =>
      patchFeedItems(
        queryClient,
        () => true,
        (item) => item,
      ),
    ).not.toThrow();
  });

  it("returns a snapshot that restoreQueries can use to roll back the patch", () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(feedKeys.following("all"), {
      pages: [{ items: [makeItem("a")], nextCursor: null }],
      pageParams: [undefined],
    });

    const snapshot = patchFeedItems(
      queryClient,
      (item) => item.id === "a",
      (item) => ({ ...item, engagement: { ...item.engagement, likeCount: 99 } }),
    );

    restoreQueries(queryClient, snapshot);

    const data = queryClient.getQueryData(feedKeys.following("all")) as {
      pages: Array<{ items: FeedItem[] }>;
    };
    expect(data.pages[0]!.items[0]!.engagement.likeCount).toBe(0);
  });
});
