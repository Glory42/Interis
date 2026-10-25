import { describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { server } from "../../../support/msw/server";
import { useCreateDiaryEntry } from "@/features/diary/hooks/useDiary";
import { interactionKeys } from "@/features/interactions/hooks/useInteractions";
import { serialKeys } from "@/features/serials/hooks/serials/query-keys";
import { useCreateSeriesLog } from "@/features/serials/hooks/useSerials";

// A rated log sets "Your rating" and logging marks the title watched, so
// both log hooks refetch the viewer's interaction (#91).
const setup = () => {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const invalidate = vi.spyOn(queryClient, "invalidateQueries");
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  const invalidatedKeys = () => invalidate.mock.calls.map(([filters]) => filters?.queryKey);
  return { wrapper, invalidatedKeys };
};

describe("logging refreshes the viewer's rating", () => {
  it("refetches the movie interaction after a movie log", async () => {
    server.use(
      http.post("*/api/diary", () =>
        HttpResponse.json({
          entry: {
            id: "entry-1",
            userId: "user-1",
            movieId: 1,
            watchedDate: "2026-03-01",
            rating: 8,
            rewatch: false,
            createdAt: "2026-03-01T00:00:00.000Z",
            updatedAt: "2026-03-01T00:00:00.000Z",
          },
          movie: {
            id: 1,
            tmdbId: 550,
            title: "Fight Club",
            originalTitle: null,
            posterPath: null,
            backdropPath: null,
            releaseYear: 1999,
            runtime: null,
            overview: null,
            tagline: null,
            cachedAt: "2026-03-01T00:00:00.000Z",
          },
          review: null,
        }),
      ),
    );
    const { wrapper, invalidatedKeys } = setup();

    const { result } = renderHook(() => useCreateDiaryEntry(), { wrapper });
    await act(() =>
      result.current.mutateAsync({ tmdbId: 550, watchedDate: "2026-03-01", rating: 8 }),
    );

    expect(invalidatedKeys()).toContainEqual(interactionKeys.detail(550));
  });

  it("refetches the series interaction after a series log", async () => {
    const { wrapper, invalidatedKeys } = setup();

    const { result } = renderHook(() => useCreateSeriesLog(1399), { wrapper });
    await act(() => result.current.mutateAsync({ watchedDate: "2026-03-01", rating: 8 }));

    expect(invalidatedKeys()).toContainEqual(serialKeys.interaction(1399));
  });
});
