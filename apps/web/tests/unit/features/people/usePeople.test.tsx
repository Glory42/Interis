import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { server } from "../../../support/msw/server";
import { peopleKeys, usePersonDetail } from "@/features/people/hooks/usePeople";

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

describe("peopleKeys", () => {
  it("scopes a detail key by role and slug", () => {
    expect(peopleKeys.detail("director", "greta-gerwig")).toEqual([
      "people",
      "detail",
      "director",
      "greta-gerwig",
    ]);
  });

  it("keeps `all` as a prefix of every detail key", () => {
    expect(peopleKeys.detail("actor", "x").slice(0, 1)).toEqual([...peopleKeys.all]);
  });
});

describe("usePersonDetail", () => {
  it("does not fetch when explicitly disabled", () => {
    const queryClient = createTestQueryClient();
    const { result } = renderHook(() => usePersonDetail("actor", "timothee-chalamet", false), {
      wrapper: wrapperFor(queryClient),
    });
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("requests /api/people/:role/:slug when enabled", async () => {
    let hit = "";
    server.use(
      http.get("*/api/people/:role/:slug", ({ params }) => {
        hit = `${params.role as string}/${params.slug as string}`;
        return HttpResponse.json({ error: "not found" }, { status: 404 });
      }),
    );

    const queryClient = createTestQueryClient();
    const { result } = renderHook(() => usePersonDetail("director", "greta-gerwig"), {
      wrapper: wrapperFor(queryClient),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(hit).toBe("director/greta-gerwig");
  });
});
