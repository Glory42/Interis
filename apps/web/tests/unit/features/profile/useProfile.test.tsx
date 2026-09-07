import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { server } from "../../../support/msw/server";
import {
  profileKeys,
  useUpdateMyProfile,
  useUserProfile,
} from "@/features/profile/hooks/useProfile";
import { authKeys } from "@/features/auth/hooks/useAuth";

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

const isInvalidated = (queryClient: QueryClient, key: readonly unknown[]) =>
  queryClient.getQueryState(key)?.isInvalidated ?? false;

const okUpdateResponse = () =>
  HttpResponse.json({
    userId: "u1",
    isAdmin: false,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-02T00:00:00.000Z",
  });

describe("useUserProfile", () => {
  it("stays idle for a blank username", () => {
    const queryClient = createTestQueryClient();
    const { result } = renderHook(() => useUserProfile("   "), {
      wrapper: wrapperFor(queryClient),
    });
    expect(result.current.fetchStatus).toBe("idle");
  });
});

describe("useUpdateMyProfile", () => {
  const seedProfileCaches = (queryClient: QueryClient, username: string) => {
    for (const key of [
      profileKeys.detail(username),
      profileKeys.likes(username),
      profileKeys.watchlist(username),
      profileKeys.reviews(username),
      profileKeys.topPicks(username),
      profileKeys.diary(username),
      profileKeys.currentlyWatching(username),
    ]) {
      queryClient.setQueryData(key, {});
    }
  };

  it("invalidates the current user's own profile surfaces after a successful update", async () => {
    server.use(http.put("*/api/users/me", okUpdateResponse));

    const queryClient = createTestQueryClient();
    queryClient.setQueryData(authKeys.me, { username: "me_user" });
    seedProfileCaches(queryClient, "me_user");

    const { result } = renderHook(() => useUpdateMyProfile(), {
      wrapper: wrapperFor(queryClient),
    });
    result.current.mutate({ bio: "hi" } as never);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    await waitFor(() => expect(isInvalidated(queryClient, authKeys.me)).toBe(true));

    expect(isInvalidated(queryClient, profileKeys.detail("me_user"))).toBe(true);
    expect(isInvalidated(queryClient, profileKeys.likes("me_user"))).toBe(true);
    expect(isInvalidated(queryClient, profileKeys.watchlist("me_user"))).toBe(true);
    expect(isInvalidated(queryClient, profileKeys.reviews("me_user"))).toBe(true);
    expect(isInvalidated(queryClient, profileKeys.topPicks("me_user"))).toBe(true);
  });

  it("leaves diary / currently-watching untouched (not part of the profile-edit surface)", async () => {
    server.use(http.put("*/api/users/me", okUpdateResponse));

    const queryClient = createTestQueryClient();
    queryClient.setQueryData(authKeys.me, { username: "me_user" });
    seedProfileCaches(queryClient, "me_user");

    const { result } = renderHook(() => useUpdateMyProfile(), {
      wrapper: wrapperFor(queryClient),
    });
    result.current.mutate({ bio: "hi" } as never);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    await waitFor(() => expect(isInvalidated(queryClient, authKeys.me)).toBe(true));

    expect(isInvalidated(queryClient, profileKeys.diary("me_user"))).toBe(false);
    expect(isInvalidated(queryClient, profileKeys.currentlyWatching("me_user"))).toBe(false);
  });

  it("never invalidates another user's profile cache", async () => {
    server.use(http.put("*/api/users/me", okUpdateResponse));

    const queryClient = createTestQueryClient();
    queryClient.setQueryData(authKeys.me, { username: "me_user" });
    seedProfileCaches(queryClient, "me_user");
    queryClient.setQueryData(profileKeys.detail("someone_else"), {});

    const { result } = renderHook(() => useUpdateMyProfile(), {
      wrapper: wrapperFor(queryClient),
    });
    result.current.mutate({ bio: "hi" } as never);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    await waitFor(() => expect(isInvalidated(queryClient, authKeys.me)).toBe(true));

    expect(isInvalidated(queryClient, profileKeys.detail("someone_else"))).toBe(false);
  });

  it("only invalidates auth/me when there is no cached username to scope by", async () => {
    server.use(http.put("*/api/users/me", okUpdateResponse));

    const queryClient = createTestQueryClient();
    queryClient.setQueryData(authKeys.me, null);
    queryClient.setQueryData(profileKeys.detail("me_user"), {});

    const { result } = renderHook(() => useUpdateMyProfile(), {
      wrapper: wrapperFor(queryClient),
    });
    result.current.mutate({ bio: "hi" } as never);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    await waitFor(() => expect(isInvalidated(queryClient, authKeys.me)).toBe(true));

    expect(isInvalidated(queryClient, profileKeys.detail("me_user"))).toBe(false);
  });
});
