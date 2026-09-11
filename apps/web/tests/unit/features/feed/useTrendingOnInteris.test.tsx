import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { server } from "../../../support/msw/server";
import { useTrendingOnInteris } from "@/features/feed/hooks/useFeed";

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

describe("useTrendingOnInteris", () => {
  it("fetches and returns the globally trending titles", async () => {
    server.use(
      http.get("*/api/social/trending", () =>
        HttpResponse.json({
          items: [
            {
              mediaType: "movie",
              tmdbId: 550,
              title: "Fight Club",
              posterPath: "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
              releaseYear: 1999,
              distinctUserCount: 3,
            },
          ],
        }),
      ),
    );

    const queryClient = createTestQueryClient();
    const { result } = renderHook(() => useTrendingOnInteris(), {
      wrapper: wrapperFor(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual([
      {
        mediaType: "movie",
        tmdbId: 550,
        title: "Fight Club",
        posterPath: "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
        releaseYear: 1999,
        distinctUserCount: 3,
      },
    ]);
  });
});
