import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { server } from "../../../support/msw/server";
import {
  socialKeys,
  useFollowUser,
  useUnfollowFromList,
} from "@/features/social/hooks/useSocial";
import { feedKeys } from "@/features/feed/hooks/useFeed";
import { profileKeys } from "@/features/profile/hooks/useProfile";
import type { FollowState, FollowUser } from "@/features/social/api";

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

describe("useFollowUser", () => {
  it("optimistically sets isFollowing before the request resolves", async () => {
    server.use(
      http.post("*/api/social/follow/target", async () => {
        await new Promise((resolve) => setTimeout(resolve, 20));
        return HttpResponse.json({ success: true });
      }),
    );

    const queryClient = createTestQueryClient();
    queryClient.setQueryData(socialKeys.followState("target"), {
      isFollowing: false,
    } satisfies FollowState);

    const { result } = renderHook(() => useFollowUser("target"), {
      wrapper: wrapperFor(queryClient),
    });

    result.current.mutate();

    await waitFor(() => {
      const cached = queryClient.getQueryData<FollowState>(socialKeys.followState("target"));
      expect(cached?.isFollowing).toBe(true);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("rolls back isFollowing on failure", async () => {
    server.use(
      http.post("*/api/social/follow/target", () =>
        HttpResponse.json({ error: "nope" }, { status: 400 }),
      ),
    );

    const queryClient = createTestQueryClient();
    queryClient.setQueryData(socialKeys.followState("target"), {
      isFollowing: false,
    } satisfies FollowState);

    const { result } = renderHook(() => useFollowUser("target"), {
      wrapper: wrapperFor(queryClient),
    });

    result.current.mutate();
    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(
      queryClient.getQueryData<FollowState>(socialKeys.followState("target")),
    ).toEqual({ isFollowing: false });
  });

  it("invalidates its own follow state, the feed root, and me-summary - never a different user's follow state", async () => {
    server.use(http.post("*/api/social/follow/target", () => HttpResponse.json({ success: true })));

    const queryClient = createTestQueryClient();
    queryClient.setQueryData(socialKeys.followState("target"), {
      isFollowing: false,
    } satisfies FollowState);
    queryClient.setQueryData(socialKeys.followState("someone-else"), {
      isFollowing: false,
    } satisfies FollowState);
    queryClient.setQueryData(feedKeys.followingRoot, { pages: [], pageParams: [] });
    queryClient.setQueryData(feedKeys.meSummary, {});

    const { result } = renderHook(() => useFollowUser("target"), {
      wrapper: wrapperFor(queryClient),
    });

    result.current.mutate();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(queryClient.getQueryState(socialKeys.followState("target"))?.isInvalidated).toBe(
      true,
    );
    expect(queryClient.getQueryState(feedKeys.followingRoot)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(feedKeys.meSummary)?.isInvalidated).toBe(true);

    expect(
      queryClient.getQueryState(socialKeys.followState("someone-else"))?.isInvalidated,
    ).toBe(false);
  });
});

describe("useUnfollowFromList", () => {
  it("optimistically removes the target from the cached following list, then invalidates its own scoped keys", async () => {
    server.use(
      http.delete("*/api/social/follow/bob", () => HttpResponse.json({ success: true })),
    );

    const queryClient = createTestQueryClient();
    const followingList: FollowUser[] = [
      { id: "u1", username: "alice", displayUsername: null, avatarUrl: null },
      { id: "u2", username: "bob", displayUsername: null, avatarUrl: null },
    ];
    queryClient.setQueryData(socialKeys.following("viewer"), followingList);
    queryClient.setQueryData(profileKeys.detail("viewer"), { username: "viewer" });
    queryClient.setQueryData(socialKeys.followState("bob"), { isFollowing: true });
    // A different profile's following list must not be touched.
    queryClient.setQueryData(socialKeys.following("someone-else"), followingList);

    const { result } = renderHook(() => useUnfollowFromList("viewer"), {
      wrapper: wrapperFor(queryClient),
    });

    result.current.mutate("bob");

    await waitFor(() => {
      const cached = queryClient.getQueryData<FollowUser[]>(socialKeys.following("viewer"));
      expect(cached?.map((u) => u.username)).toEqual(["alice"]);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(queryClient.getQueryState(socialKeys.followState("bob"))?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(profileKeys.detail("viewer"))?.isInvalidated).toBe(true);
    expect(
      queryClient.getQueryData<FollowUser[]>(socialKeys.following("someone-else"))?.length,
    ).toBe(2);
  });

  it("restores the removed entry on failure", async () => {
    server.use(
      http.delete("*/api/social/follow/bob", () =>
        HttpResponse.json({ error: "nope" }, { status: 400 }),
      ),
    );

    const queryClient = createTestQueryClient();
    const followingList: FollowUser[] = [
      { id: "u2", username: "bob", displayUsername: null, avatarUrl: null },
    ];
    queryClient.setQueryData(socialKeys.following("viewer"), followingList);

    const { result } = renderHook(() => useUnfollowFromList("viewer"), {
      wrapper: wrapperFor(queryClient),
    });

    result.current.mutate("bob");
    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(queryClient.getQueryData<FollowUser[]>(socialKeys.following("viewer"))).toEqual(
      followingList,
    );
  });
});
