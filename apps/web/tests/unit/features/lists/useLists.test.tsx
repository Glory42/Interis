import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { server } from "../../../support/msw/server";
import {
  listKeys,
  useAddListItem,
  useCreateList,
  useLikeList,
} from "@/features/lists/hooks/useLists";
import { profileKeys } from "@/features/profile/hooks/useProfile";
import type { ListDetail } from "@/features/lists/api";

const createTestQueryClient = (): QueryClient =>
  new QueryClient({
    // gcTime must not be 0 here: these tests seed cache entries via
    // setQueryData without an active useQuery observer on them (only the
    // mutation hook is rendered), and gcTime: 0 garbage-collects
    // unobserved data almost immediately - before the mutation's
    // onMutate/onSuccess handlers even get a chance to read or
    // invalidate it.
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

const wrapperFor = (queryClient: QueryClient) => {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return Wrapper;
};

const baseListDetail: ListDetail = {
  id: "list-1",
  userId: "user-1",
  title: "My List",
  description: null,
  isRanked: false,
  isPublic: true,
  derivedType: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  itemCount: 0,
  items: [],
  likeCount: 0,
  likedByViewer: false,
};

describe("useLikeList", () => {
  it("optimistically updates likeCount/likedByViewer before the request resolves", async () => {
    server.use(
      http.post("*/api/lists/list-1/like", async () => {
        await new Promise((resolve) => setTimeout(resolve, 20));
        return HttpResponse.json({ success: true, likeCount: 1 });
      }),
    );

    const queryClient = createTestQueryClient();
    queryClient.setQueryData(listKeys.detail("list-1"), baseListDetail);

    const { result } = renderHook(() => useLikeList("list-1", "viewer"), {
      wrapper: wrapperFor(queryClient),
    });

    result.current.mutate();

    await waitFor(() => {
      const cached = queryClient.getQueryData<ListDetail>(listKeys.detail("list-1"));
      expect(cached?.likedByViewer).toBe(true);
      expect(cached?.likeCount).toBe(1);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("rolls back the optimistic update when the request fails", async () => {
    server.use(
      http.post("*/api/lists/list-1/like", () =>
        HttpResponse.json({ error: "nope" }, { status: 400 }),
      ),
    );

    const queryClient = createTestQueryClient();
    queryClient.setQueryData(listKeys.detail("list-1"), baseListDetail);

    const { result } = renderHook(() => useLikeList("list-1", "viewer"), {
      wrapper: wrapperFor(queryClient),
    });

    result.current.mutate();

    await waitFor(() => expect(result.current.isError).toBe(true));

    const cached = queryClient.getQueryData<ListDetail>(listKeys.detail("list-1"));
    expect(cached?.likedByViewer).toBe(false);
    expect(cached?.likeCount).toBe(0);
  });

  it("invalidates only the liked list's own detail and the liker's likedLists, nothing else", async () => {
    server.use(
      http.post("*/api/lists/list-1/like", () =>
        HttpResponse.json({ success: true, likeCount: 1 }),
      ),
    );

    const queryClient = createTestQueryClient();
    queryClient.setQueryData(listKeys.detail("list-1"), baseListDetail);
    queryClient.setQueryData(listKeys.userLists("owner"), []);
    queryClient.setQueryData(profileKeys.detail("viewer"), { username: "viewer" });
    queryClient.setQueryData(profileKeys.likedLists("viewer"), []);
    // A different user's likedLists must never be touched by this mutation.
    queryClient.setQueryData(profileKeys.likedLists("someone-else"), []);

    const { result } = renderHook(() => useLikeList("list-1", "viewer"), {
      wrapper: wrapperFor(queryClient),
    });

    result.current.mutate();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(queryClient.getQueryState(listKeys.detail("list-1"))?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(profileKeys.likedLists("viewer"))?.isInvalidated).toBe(true);

    expect(queryClient.getQueryState(listKeys.userLists("owner"))?.isInvalidated).toBe(false);
    expect(queryClient.getQueryState(profileKeys.detail("viewer"))?.isInvalidated).toBe(false);
    expect(
      queryClient.getQueryState(profileKeys.likedLists("someone-else"))?.isInvalidated,
    ).toBe(false);
  });

  it("does not touch profileKeys.likedLists at all when no viewerUsername is provided", async () => {
    server.use(
      http.post("*/api/lists/list-1/like", () =>
        HttpResponse.json({ success: true, likeCount: 1 }),
      ),
    );

    const queryClient = createTestQueryClient();
    queryClient.setQueryData(listKeys.detail("list-1"), baseListDetail);
    queryClient.setQueryData(profileKeys.likedLists("viewer"), []);

    const { result } = renderHook(() => useLikeList("list-1", undefined), {
      wrapper: wrapperFor(queryClient),
    });

    result.current.mutate();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(queryClient.getQueryState(profileKeys.likedLists("viewer"))?.isInvalidated).toBe(
      false,
    );
  });
});

describe("useCreateList", () => {
  it("invalidates only the owner's own userLists and profile detail", async () => {
    server.use(
      http.post("*/api/lists", () =>
        HttpResponse.json({
          id: "new-list",
          userId: "user-1",
          title: "New List",
          description: null,
          isRanked: false,
          isPublic: true,
          derivedType: null,
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        }),
      ),
    );

    const queryClient = createTestQueryClient();
    queryClient.setQueryData(listKeys.userLists("owner"), []);
    queryClient.setQueryData(profileKeys.detail("owner"), { username: "owner" });
    // A different, unrelated user's cache must not be invalidated by this
    // mutation - this is exactly the over-broad-invalidation regression
    // class CLAUDE.md calls out.
    queryClient.setQueryData(listKeys.userLists("someone-else"), []);
    queryClient.setQueryData(profileKeys.detail("someone-else"), { username: "someone-else" });

    const { result } = renderHook(() => useCreateList("owner"), {
      wrapper: wrapperFor(queryClient),
    });

    result.current.mutate({ title: "New List" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(queryClient.getQueryState(listKeys.userLists("owner"))?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(profileKeys.detail("owner"))?.isInvalidated).toBe(true);

    expect(queryClient.getQueryState(listKeys.userLists("someone-else"))?.isInvalidated).toBe(
      false,
    );
    expect(queryClient.getQueryState(profileKeys.detail("someone-else"))?.isInvalidated).toBe(
      false,
    );
  });
});

describe("useAddListItem", () => {
  it("optimistically appends the item, then invalidates detail + userLists + the userListsForItems prefix (any tmdbId/itemType)", async () => {
    server.use(
      http.post("*/api/lists/list-1/items", () =>
        HttpResponse.json({ entry: { id: "entry-1" }, derivedType: "cinema" }),
      ),
    );

    const queryClient = createTestQueryClient();
    queryClient.setQueryData(listKeys.detail("list-1"), baseListDetail);
    queryClient.setQueryData(listKeys.userLists("owner"), []);
    queryClient.setQueryData(listKeys.userListsForItem("owner", 550, "cinema"), []);
    queryClient.setQueryData(listKeys.userListsForItem("owner", 999, "serial"), []);
    // A different owner's userListsForItem cache must not be touched.
    queryClient.setQueryData(listKeys.userListsForItem("someone-else", 550, "cinema"), []);

    const { result } = renderHook(() => useAddListItem("list-1", "owner"), {
      wrapper: wrapperFor(queryClient),
    });

    result.current.mutate({
      tmdbId: 550,
      itemType: "cinema",
      title: "Fight Club",
      posterPath: null,
      releaseYear: 1999,
    });

    // Optimistic update happens synchronously in onMutate.
    await waitFor(() => {
      const cached = queryClient.getQueryData<ListDetail>(listKeys.detail("list-1"));
      expect(cached?.itemCount).toBe(1);
      expect(cached?.items).toHaveLength(1);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(queryClient.getQueryState(listKeys.detail("list-1"))?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(listKeys.userLists("owner"))?.isInvalidated).toBe(true);
    // exact: false on the userListsForItems prefix means every tmdbId/
    // itemType combination under this owner gets invalidated together.
    expect(
      queryClient.getQueryState(listKeys.userListsForItem("owner", 550, "cinema"))
        ?.isInvalidated,
    ).toBe(true);
    expect(
      queryClient.getQueryState(listKeys.userListsForItem("owner", 999, "serial"))
        ?.isInvalidated,
    ).toBe(true);

    expect(
      queryClient.getQueryState(listKeys.userListsForItem("someone-else", 550, "cinema"))
        ?.isInvalidated,
    ).toBe(false);
  });
});
