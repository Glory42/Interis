import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { server } from "../../../support/msw/server";
import {
  interactionKeys,
  useUpdateMovieInteraction,
} from "@/features/interactions/hooks/useInteractions";
import { movieKeys } from "@/features/films/hooks/useMovies";
import type { MovieInteraction } from "@/features/interactions/api";

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

const baseInteraction: MovieInteraction = {
  liked: false,
  watchlisted: false,
  rating: null,
  watched: false,
};

describe("useUpdateMovieInteraction", () => {
  it("optimistically merges only the fields sent, without clobbering the rest", async () => {
    server.use(
      http.put("*/api/interactions/550", async () => {
        await new Promise((resolve) => setTimeout(resolve, 20));
        return HttpResponse.json({ ...baseInteraction, watchlisted: true });
      }),
    );

    const queryClient = createTestQueryClient();
    queryClient.setQueryData(interactionKeys.detail(550), {
      ...baseInteraction,
      liked: true,
    } satisfies MovieInteraction);

    const { result } = renderHook(() => useUpdateMovieInteraction(550), {
      wrapper: wrapperFor(queryClient),
    });

    result.current.mutate({ watchlisted: true });

    await waitFor(() => {
      const cached = queryClient.getQueryData<MovieInteraction>(interactionKeys.detail(550));
      expect(cached).toEqual({
        liked: true,
        watchlisted: true,
        rating: null,
        watched: false,
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("rating implicitly marks the movie watched in the optimistic update", async () => {
    server.use(
      http.put("*/api/interactions/550", () =>
        HttpResponse.json({ ...baseInteraction, rating: 8, watched: true }),
      ),
    );

    const queryClient = createTestQueryClient();
    queryClient.setQueryData(interactionKeys.detail(550), baseInteraction);

    const { result } = renderHook(() => useUpdateMovieInteraction(550), {
      wrapper: wrapperFor(queryClient),
    });

    result.current.mutate({ rating: 8 });

    await waitFor(() => {
      const cached = queryClient.getQueryData<MovieInteraction>(interactionKeys.detail(550));
      expect(cached?.rating).toBe(8);
      expect(cached?.watched).toBe(true);
    });
  });

  it("the implicit-watch signal wins over an explicit watched:false in the optimistic update", async () => {
    server.use(
      http.put("*/api/interactions/550", () =>
        HttpResponse.json({ ...baseInteraction, liked: true, watched: true }),
      ),
    );

    const queryClient = createTestQueryClient();
    queryClient.setQueryData(interactionKeys.detail(550), baseInteraction);

    const { result } = renderHook(() => useUpdateMovieInteraction(550), {
      wrapper: wrapperFor(queryClient),
    });

    result.current.mutate({ liked: true, watched: false });

    await waitFor(() => {
      const cached = queryClient.getQueryData<MovieInteraction>(interactionKeys.detail(550));
      expect(cached?.watched).toBe(true);
    });
  });

  it("rolls back to the previous state when the request fails", async () => {
    server.use(
      http.put("*/api/interactions/550", () =>
        HttpResponse.json({ error: "nope" }, { status: 400 }),
      ),
    );

    const queryClient = createTestQueryClient();
    queryClient.setQueryData(interactionKeys.detail(550), baseInteraction);

    const { result } = renderHook(() => useUpdateMovieInteraction(550), {
      wrapper: wrapperFor(queryClient),
    });

    result.current.mutate({ liked: true });
    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(queryClient.getQueryData<MovieInteraction>(interactionKeys.detail(550))).toEqual(
      baseInteraction,
    );
  });

  it("invalidates only this movie's own interaction/detail/logs keys, never a different movie's", async () => {
    server.use(
      http.put("*/api/interactions/550", () =>
        HttpResponse.json({ ...baseInteraction, liked: true, watched: true }),
      ),
    );

    const queryClient = createTestQueryClient();
    queryClient.setQueryData(interactionKeys.detail(550), baseInteraction);
    queryClient.setQueryData(movieKeys.detail(550), { tmdbId: 550 });
    queryClient.setQueryData([...movieKeys.detailViewRoot(550), "recent"], { tmdbId: 550 });
    queryClient.setQueryData(movieKeys.logs(550), []);

    // A different, unrelated movie's cache must not be touched.
    queryClient.setQueryData(interactionKeys.detail(999), baseInteraction);
    queryClient.setQueryData(movieKeys.detail(999), { tmdbId: 999 });

    const { result } = renderHook(() => useUpdateMovieInteraction(550), {
      wrapper: wrapperFor(queryClient),
    });

    result.current.mutate({ liked: true });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(queryClient.getQueryState(interactionKeys.detail(550))?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(movieKeys.detail(550))?.isInvalidated).toBe(true);
    expect(
      queryClient.getQueryState([...movieKeys.detailViewRoot(550), "recent"])?.isInvalidated,
    ).toBe(true);
    expect(queryClient.getQueryState(movieKeys.logs(550))?.isInvalidated).toBe(true);

    expect(queryClient.getQueryState(interactionKeys.detail(999))?.isInvalidated).toBe(false);
    expect(queryClient.getQueryState(movieKeys.detail(999))?.isInvalidated).toBe(false);
  });
});
