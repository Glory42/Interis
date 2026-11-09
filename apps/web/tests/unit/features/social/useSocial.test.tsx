import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { server } from "../../../support/msw/server";
import {
  socialKeys,
  useFollowToggle,
  useFollowUser,
  useRemoveFollowerFromList,
  useUnfollowUser,
} from "@/features/social/hooks/useSocial";
import { authKeys } from "@/features/auth/hooks/useAuth";
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
    queryClient.setQueryData(feedKeys.grouped("all"), { pages: [], pageParams: [] });
    queryClient.setQueryData(feedKeys.meSummary, {});

    const { result } = renderHook(() => useFollowUser("target"), {
      wrapper: wrapperFor(queryClient),
    });

    result.current.mutate();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(queryClient.getQueryState(socialKeys.followState("target"))?.isInvalidated).toBe(
      true,
    );
    expect(queryClient.getQueryState(feedKeys.grouped("all"))?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(feedKeys.meSummary)?.isInvalidated).toBe(true);

    expect(
      queryClient.getQueryState(socialKeys.followState("someone-else"))?.isInvalidated,
    ).toBe(false);
  });
});

describe("useFollowToggle", () => {
  const seedViewerFollows = (queryClient: QueryClient) => {
    queryClient.setQueryData(socialKeys.viewerFollows("u1,u2"), ["u2"]);
    // A batch that never asked about bob stays untouched.
    queryClient.setQueryData(socialKeys.viewerFollows("u1,u3"), ["u3"]);
  };

  it("flips the row at once in every batch that asked about the user, keeping the following list", async () => {
    server.use(
      http.delete("*/api/social/follow/bob", async () => {
        await new Promise((resolve) => setTimeout(resolve, 20));
        return HttpResponse.json({ success: true });
      }),
    );

    const queryClient = createTestQueryClient();
    const followingList: FollowUser[] = [
      { id: "u1", username: "alice", displayUsername: null, avatarUrl: null },
      { id: "u2", username: "bob", displayUsername: null, avatarUrl: null },
    ];
    queryClient.setQueryData(authKeys.me, { username: "viewer" });
    queryClient.setQueryData(socialKeys.following("viewer"), followingList);
    queryClient.setQueryData(socialKeys.followState("bob"), { isFollowing: true });
    seedViewerFollows(queryClient);

    const { result } = renderHook(() => useFollowToggle(), {
      wrapper: wrapperFor(queryClient),
    });

    result.current.mutate({ userId: "u2", username: "bob", follow: false });

    await waitFor(() => {
      expect(queryClient.getQueryData(socialKeys.viewerFollows("u1,u2"))).toEqual([]);
    });
    expect(queryClient.getQueryData(socialKeys.followState("bob"))).toEqual({ isFollowing: false });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(queryClient.getQueryData(socialKeys.viewerFollows("u1,u3"))).toEqual(["u3"]);
    // The open dialog keeps bob's row (now "Follow") until it is reopened.
    expect(queryClient.getQueryData<FollowUser[]>(socialKeys.following("viewer"))).toEqual(followingList);
    expect(queryClient.getQueryState(socialKeys.following("viewer"))?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(socialKeys.followState("bob"))?.isInvalidated).toBe(true);
  });

  it("flips the row back when the request fails", async () => {
    server.use(
      http.post("*/api/social/follow/alice", () =>
        HttpResponse.json({ error: "nope" }, { status: 400 }),
      ),
    );

    const queryClient = createTestQueryClient();
    seedViewerFollows(queryClient);

    const { result } = renderHook(() => useFollowToggle(), {
      wrapper: wrapperFor(queryClient),
    });

    result.current.mutate({ userId: "u1", username: "alice", follow: true });
    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(queryClient.getQueryData(socialKeys.viewerFollows("u1,u2"))).toEqual(["u2"]);
    expect(queryClient.getQueryData(socialKeys.viewerFollows("u1,u3"))).toEqual(["u3"]);
  });
});

describe("profile follow button and viewer-follows", () => {
  it("following from a profile marks that user followed in cached batches", async () => {
    server.use(http.post("*/api/social/follow/target", () => HttpResponse.json({ success: true })));
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(profileKeys.detail("target"), { id: "t1", username: "target" });
    queryClient.setQueryData(socialKeys.viewerFollows("t1,u9"), []);

    const { result } = renderHook(() => useFollowUser("target"), {
      wrapper: wrapperFor(queryClient),
    });
    result.current.mutate();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(queryClient.getQueryData(socialKeys.viewerFollows("t1,u9"))).toEqual(["t1"]);
  });
});

// A follow shows on both ends, so both users' counts and lists refresh (#98).
describe("follow changes refresh both users", () => {
  const seedBothEnds = (queryClient: QueryClient, follower: string, followed: string) => {
    queryClient.setQueryData(profileKeys.detail(follower), { username: follower });
    queryClient.setQueryData(profileKeys.detail(followed), { username: followed });
    queryClient.setQueryData<FollowUser[]>(socialKeys.following(follower), []);
    queryClient.setQueryData<FollowUser[]>(socialKeys.followers(followed), []);
  };

  const expectBothEndsInvalidated = (
    queryClient: QueryClient,
    follower: string,
    followed: string,
  ) => {
    for (const key of [
      profileKeys.detail(follower),
      socialKeys.following(follower),
      profileKeys.detail(followed),
      socialKeys.followers(followed),
    ]) {
      expect(queryClient.getQueryState(key)?.isInvalidated, JSON.stringify(key)).toBe(true);
    }
  };

  it("following refreshes the viewer's following and the target's followers", async () => {
    server.use(http.post("*/api/social/follow/target", () => HttpResponse.json({ success: true })));
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(authKeys.me, { username: "viewer" });
    seedBothEnds(queryClient, "viewer", "target");

    const { result } = renderHook(() => useFollowUser("target"), {
      wrapper: wrapperFor(queryClient),
    });
    result.current.mutate();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expectBothEndsInvalidated(queryClient, "viewer", "target");
  });

  it("unfollowing refreshes the viewer's following and the target's followers", async () => {
    server.use(
      http.delete("*/api/social/follow/target", () => HttpResponse.json({ success: true })),
    );
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(authKeys.me, { username: "viewer" });
    seedBothEnds(queryClient, "viewer", "target");

    const { result } = renderHook(() => useUnfollowUser("target"), {
      wrapper: wrapperFor(queryClient),
    });
    result.current.mutate();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expectBothEndsInvalidated(queryClient, "viewer", "target");
  });

  it("toggling from a list refreshes both ends", async () => {
    server.use(http.delete("*/api/social/follow/bob", () => HttpResponse.json({ success: true })));
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(authKeys.me, { username: "viewer" });
    seedBothEnds(queryClient, "viewer", "bob");

    const { result } = renderHook(() => useFollowToggle(), {
      wrapper: wrapperFor(queryClient),
    });
    result.current.mutate({ userId: "u2", username: "bob", follow: false });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expectBothEndsInvalidated(queryClient, "viewer", "bob");
  });

  it("removing a follower refreshes that follower's following", async () => {
    server.use(
      http.delete("*/api/social/follower/fan", () => HttpResponse.json({ success: true })),
    );
    const queryClient = createTestQueryClient();
    seedBothEnds(queryClient, "fan", "viewer");

    const { result } = renderHook(() => useRemoveFollowerFromList("viewer"), {
      wrapper: wrapperFor(queryClient),
    });
    result.current.mutate("fan");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expectBothEndsInvalidated(queryClient, "fan", "viewer");
  });
});
