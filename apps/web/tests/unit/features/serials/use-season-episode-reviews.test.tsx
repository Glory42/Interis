import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { server } from "../../../support/msw/server";
import {
  useDeleteEpisodeReview,
  useDeleteSeasonReview,
  useUpsertEpisodeReview,
  useUpsertSeasonReview,
} from "@/features/serials/hooks/serials/use-season-episode-reviews";
import { feedKeys } from "@/features/feed/hooks/useFeed";

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

const reviewResponse = () =>
  HttpResponse.json({
    id: "review-1",
    content: "great season",
    containsSpoilers: false,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  });

describe("useUpsertSeasonReview", () => {
  it("invalidates the following feed alongside the season review and detail-view caches", async () => {
    server.use(http.post("*/api/serials/1399/seasons/1/review", async () => reviewResponse()));

    const queryClient = createTestQueryClient();
    queryClient.setQueryData(feedKeys.followingRoot, { pages: [], pageParams: [] });

    const { result } = renderHook(() => useUpsertSeasonReview(1399, 1), {
      wrapper: wrapperFor(queryClient),
    });

    result.current.mutate({ content: "great season" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(queryClient.getQueryState(feedKeys.followingRoot)?.isInvalidated).toBe(true);
  });
});

describe("useDeleteSeasonReview", () => {
  it("invalidates the following feed on delete", async () => {
    server.use(http.delete("*/api/serials/1399/seasons/1/review", async () => HttpResponse.json({})));

    const queryClient = createTestQueryClient();
    queryClient.setQueryData(feedKeys.followingRoot, { pages: [], pageParams: [] });

    const { result } = renderHook(() => useDeleteSeasonReview(1399, 1), {
      wrapper: wrapperFor(queryClient),
    });

    result.current.mutate();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(queryClient.getQueryState(feedKeys.followingRoot)?.isInvalidated).toBe(true);
  });
});

describe("useUpsertEpisodeReview", () => {
  it("invalidates the following feed alongside the episode review and season-detail caches", async () => {
    server.use(
      http.post("*/api/serials/1399/seasons/1/episodes/3/review", async () => reviewResponse()),
    );

    const queryClient = createTestQueryClient();
    queryClient.setQueryData(feedKeys.followingRoot, { pages: [], pageParams: [] });

    const { result } = renderHook(() => useUpsertEpisodeReview(1399, 1, 3), {
      wrapper: wrapperFor(queryClient),
    });

    result.current.mutate({ content: "great episode" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(queryClient.getQueryState(feedKeys.followingRoot)?.isInvalidated).toBe(true);
  });
});

describe("useDeleteEpisodeReview", () => {
  it("invalidates the following feed on delete", async () => {
    server.use(
      http.delete("*/api/serials/1399/seasons/1/episodes/3/review", async () => HttpResponse.json({})),
    );

    const queryClient = createTestQueryClient();
    queryClient.setQueryData(feedKeys.followingRoot, { pages: [], pageParams: [] });

    const { result } = renderHook(() => useDeleteEpisodeReview(1399, 1, 3), {
      wrapper: wrapperFor(queryClient),
    });

    result.current.mutate();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(queryClient.getQueryState(feedKeys.followingRoot)?.isInvalidated).toBe(true);
  });
});
