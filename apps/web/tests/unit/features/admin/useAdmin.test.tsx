import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { server } from "../../../support/msw/server";
import {
  adminKeys,
  useDeleteUser,
  useDismissReport,
  usePromoteUser,
  useResetUserPassword,
  useResolveReport,
  useSuspendUser,
} from "@/features/admin/hooks/useAdmin";

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

const seedAdminCaches = (queryClient: QueryClient) => {
  queryClient.setQueryData(adminKeys.reports(), []);
  queryClient.setQueryData(adminKeys.reports("pending"), []);
  queryClient.setQueryData(adminKeys.users(), []);
  queryClient.setQueryData(adminKeys.users("alice"), []);
};

const isInvalidated = (queryClient: QueryClient, key: readonly unknown[]) =>
  queryClient.getQueryState(key)?.isInvalidated ?? false;

describe("adminKeys", () => {
  it("collapses an absent status/query into a stable trailing segment", () => {
    expect(adminKeys.reports()).toEqual(["admin", "reports", "all"]);
    expect(adminKeys.users()).toEqual(["admin", "users", ""]);
  });

  it("keeps reportsAll / usersAll as prefixes of their parameterized keys", () => {
    expect(adminKeys.reports("pending").slice(0, 2)).toEqual([...adminKeys.reportsAll]);
    expect(adminKeys.users("bob").slice(0, 2)).toEqual([...adminKeys.usersAll]);
  });
});

describe("report mutations", () => {
  it("useDismissReport invalidates every report list but no user list", async () => {
    server.use(
      http.post("*/api/reports/r1/dismiss", () => HttpResponse.json({ success: true })),
    );

    const queryClient = createTestQueryClient();
    seedAdminCaches(queryClient);

    const { result } = renderHook(() => useDismissReport(), {
      wrapper: wrapperFor(queryClient),
    });
    result.current.mutate("r1");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(isInvalidated(queryClient, adminKeys.reports())).toBe(true);
    expect(isInvalidated(queryClient, adminKeys.reports("pending"))).toBe(true);
    expect(isInvalidated(queryClient, adminKeys.users())).toBe(false);
    expect(isInvalidated(queryClient, adminKeys.users("alice"))).toBe(false);
  });

  it("useResolveReport rolls nothing back and settles on error", async () => {
    server.use(
      http.post("*/api/reports/r1/resolve", () =>
        HttpResponse.json({ error: "no" }, { status: 400 }),
      ),
    );

    const queryClient = createTestQueryClient();
    seedAdminCaches(queryClient);

    const { result } = renderHook(() => useResolveReport(), {
      wrapper: wrapperFor(queryClient),
    });
    result.current.mutate("r1");
    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(isInvalidated(queryClient, adminKeys.reports())).toBe(false);
  });
});

describe("user mutations", () => {
  it("useSuspendUser invalidates every user list but no report list", async () => {
    server.use(
      http.post("*/api/admin/users/alice/suspend", () =>
        HttpResponse.json({ success: true }),
      ),
    );

    const queryClient = createTestQueryClient();
    seedAdminCaches(queryClient);

    const { result } = renderHook(() => useSuspendUser(), {
      wrapper: wrapperFor(queryClient),
    });
    result.current.mutate({ username: "alice", reason: "spam" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(isInvalidated(queryClient, adminKeys.users())).toBe(true);
    expect(isInvalidated(queryClient, adminKeys.users("alice"))).toBe(true);
    expect(isInvalidated(queryClient, adminKeys.reports())).toBe(false);
  });

  it("usePromoteUser invalidates the user lists", async () => {
    server.use(
      http.post("*/api/admin/users/alice/promote", () =>
        HttpResponse.json({ success: true }),
      ),
    );

    const queryClient = createTestQueryClient();
    seedAdminCaches(queryClient);

    const { result } = renderHook(() => usePromoteUser(), {
      wrapper: wrapperFor(queryClient),
    });
    result.current.mutate("alice");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(isInvalidated(queryClient, adminKeys.users())).toBe(true);
  });

  it("useDeleteUser invalidates the user lists", async () => {
    server.use(
      http.delete("*/api/admin/users/alice", () => HttpResponse.json({ success: true })),
    );

    const queryClient = createTestQueryClient();
    seedAdminCaches(queryClient);

    const { result } = renderHook(() => useDeleteUser(), {
      wrapper: wrapperFor(queryClient),
    });
    result.current.mutate("alice");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(isInvalidated(queryClient, adminKeys.users())).toBe(true);
  });

  it("useResetUserPassword touches no cache at all (it is a pure action)", async () => {
    server.use(
      http.post("*/api/admin/users/alice/reset-password", () =>
        HttpResponse.json({ success: true }),
      ),
    );

    const queryClient = createTestQueryClient();
    seedAdminCaches(queryClient);

    const { result } = renderHook(() => useResetUserPassword(), {
      wrapper: wrapperFor(queryClient),
    });
    result.current.mutate({ username: "alice", newPassword: "hunter22" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(isInvalidated(queryClient, adminKeys.users())).toBe(false);
    expect(isInvalidated(queryClient, adminKeys.reports())).toBe(false);
  });
});
