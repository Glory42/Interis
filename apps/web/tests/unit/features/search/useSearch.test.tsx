import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { server } from "../../../support/msw/server";
import { searchKeys, useTitleSearch } from "@/features/search/hooks/useSearch";

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

describe("searchKeys", () => {
  it("keys titles by the raw query string", () => {
    expect(searchKeys.titles("dune")).toEqual(["search", "titles", "dune"]);
  });
});

describe("useTitleSearch", () => {
  it("stays idle for a query shorter than 2 non-space characters", () => {
    const queryClient = createTestQueryClient();
    const { result, rerender } = renderHook(({ q }) => useTitleSearch(q), {
      wrapper: wrapperFor(queryClient),
      initialProps: { q: "d" },
    });
    expect(result.current.fetchStatus).toBe("idle");

    rerender({ q: " d " });
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("fires once the trimmed query reaches 2 characters", async () => {
    server.use(
      http.get("*/api/search", ({ request }) => {
        expect(new URL(request.url).searchParams.get("query")).toBe("du");
        return HttpResponse.json([]);
      }),
    );

    const queryClient = createTestQueryClient();
    const { result } = renderHook(() => useTitleSearch("du"), {
      wrapper: wrapperFor(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });
});
