import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { server } from "../../../support/msw/server";
import {
  moderationKeys,
  useBlockUser,
  useMuteUser,
} from "@/features/moderation/hooks/useModeration";
import { socialKeys } from "@/features/social/hooks/useSocial";
import { feedKeys } from "@/features/feed/hooks/useFeed";
import type { RelationshipState } from "@/features/moderation/api";

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

describe("useBlockUser", () => {
  it("optimistically marks the target as blocked (and not muted) before the request resolves", async () => {
    server.use(
      http.post("*/api/moderation/block/target", async () => {
        await new Promise((resolve) => setTimeout(resolve, 20));
        return HttpResponse.json({ success: true });
      }),
    );

    const queryClient = createTestQueryClient();
    queryClient.setQueryData(moderationKeys.relationshipState("target"), {
      isBlocked: false,
      isMuted: true,
    } satisfies RelationshipState);

    const { result } = renderHook(() => useBlockUser("target"), {
      wrapper: wrapperFor(queryClient),
    });

    result.current.mutate();

    await waitFor(() => {
      const cached = queryClient.getQueryData<RelationshipState>(
        moderationKeys.relationshipState("target"),
      );
      expect(cached).toEqual({ isBlocked: true, isMuted: false });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("rolls back the relationship state on failure", async () => {
    server.use(
      http.post("*/api/moderation/block/target", () =>
        HttpResponse.json({ error: "nope" }, { status: 400 }),
      ),
    );

    const queryClient = createTestQueryClient();
    queryClient.setQueryData(moderationKeys.relationshipState("target"), {
      isBlocked: false,
      isMuted: true,
    } satisfies RelationshipState);

    const { result } = renderHook(() => useBlockUser("target"), {
      wrapper: wrapperFor(queryClient),
    });

    result.current.mutate();
    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(
      queryClient.getQueryData<RelationshipState>(moderationKeys.relationshipState("target")),
    ).toEqual({ isBlocked: false, isMuted: true });
  });

  it("invalidates only the target's own relationship state, the global blocked list, follow state, and the feed root - never an unrelated user's state", async () => {
    server.use(
      http.post("*/api/moderation/block/target", () => HttpResponse.json({ success: true })),
    );

    const queryClient = createTestQueryClient();
    queryClient.setQueryData(moderationKeys.relationshipState("target"), {
      isBlocked: false,
      isMuted: false,
    } satisfies RelationshipState);
    queryClient.setQueryData(moderationKeys.relationshipState("someone-else"), {
      isBlocked: false,
      isMuted: false,
    } satisfies RelationshipState);
    queryClient.setQueryData(moderationKeys.blocked, []);
    queryClient.setQueryData(moderationKeys.muted, []);
    queryClient.setQueryData(socialKeys.followState("target"), { isFollowing: true });
    queryClient.setQueryData(feedKeys.followingRoot, { pages: [], pageParams: [] });

    const { result } = renderHook(() => useBlockUser("target"), {
      wrapper: wrapperFor(queryClient),
    });

    result.current.mutate();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(
      queryClient.getQueryState(moderationKeys.relationshipState("target"))?.isInvalidated,
    ).toBe(true);
    expect(queryClient.getQueryState(moderationKeys.blocked)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(socialKeys.followState("target"))?.isInvalidated).toBe(
      true,
    );
    expect(queryClient.getQueryState(feedKeys.followingRoot)?.isInvalidated).toBe(true);

    // Blocking one user must not invalidate a completely unrelated
    // user's relationship state or the muted list (block and mute are
    // separate actions/queries).
    expect(
      queryClient.getQueryState(moderationKeys.relationshipState("someone-else"))
        ?.isInvalidated,
    ).toBe(false);
    expect(queryClient.getQueryState(moderationKeys.muted)?.isInvalidated).toBe(false);
  });
});

describe("useMuteUser", () => {
  it("optimistically sets isMuted without touching isBlocked, then invalidates its own scoped keys only", async () => {
    server.use(
      http.post("*/api/moderation/mute/target", () => HttpResponse.json({ success: true })),
    );

    const queryClient = createTestQueryClient();
    queryClient.setQueryData(moderationKeys.relationshipState("target"), {
      isBlocked: true,
      isMuted: false,
    } satisfies RelationshipState);
    queryClient.setQueryData(moderationKeys.blocked, []);
    queryClient.setQueryData(moderationKeys.muted, []);

    const { result } = renderHook(() => useMuteUser("target"), {
      wrapper: wrapperFor(queryClient),
    });

    result.current.mutate();

    await waitFor(() => {
      const cached = queryClient.getQueryData<RelationshipState>(
        moderationKeys.relationshipState("target"),
      );
      // isBlocked must be preserved from the existing cache, not reset.
      expect(cached).toEqual({ isBlocked: true, isMuted: true });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(queryClient.getQueryState(moderationKeys.muted)?.isInvalidated).toBe(true);
    // Muting doesn't touch the blocked list.
    expect(queryClient.getQueryState(moderationKeys.blocked)?.isInvalidated).toBe(false);
  });
});
