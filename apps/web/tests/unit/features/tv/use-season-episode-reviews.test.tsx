import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { server } from "../../../support/msw/server";
import {
  useDeleteSeasonReview,
  useUpsertSeasonReview,
} from "@/features/tv/hooks/tv/use-season-episode-reviews";

// What each hook refreshes is covered by the media-refresh table test.
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

describe("useUpsertSeasonReview", () => {
  it("sends the review target", async () => {
    let requestBody: unknown = null;
    server.use(
      http.post("*/api/serials/1399/seasons/1/review", async ({ request }) => {
        requestBody = await request.json();
        return HttpResponse.json({
          id: "review-1",
          content: "great season",
          containsSpoilers: false,
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        });
      }),
    );

    const { result } = renderHook(() => useUpsertSeasonReview(1399, 1), {
      wrapper: wrapperFor(createTestQueryClient()),
    });

    result.current.mutate({ content: "great season", createNew: true });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(requestBody).toEqual({ content: "great season", createNew: true });
  });
});

describe("useDeleteSeasonReview", () => {
  it("names the review to delete", async () => {
    let requestedUrl = "";
    server.use(
      http.delete("*/api/serials/1399/seasons/1/review", async ({ request }) => {
        requestedUrl = request.url;
        return HttpResponse.json({});
      }),
    );

    const { result } = renderHook(() => useDeleteSeasonReview(1399, 1), {
      wrapper: wrapperFor(createTestQueryClient()),
    });

    result.current.mutate("review-1");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(new URL(requestedUrl).searchParams.get("reviewId")).toBe("review-1");
  });
});
