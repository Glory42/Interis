import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { server } from "../../../support/msw/server";
import { useUpdateSeriesInteraction } from "@/features/tv/hooks/useTv";
import { seriesKeys } from "@/features/tv/hooks/tv/query-keys";
import type { SeriesInteraction } from "@/features/tv/api";

const watchlisted: SeriesInteraction = { liked: false, watchlisted: true, rating: null, watched: false, watchStatus: null };

const setup = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  queryClient.setQueryData(seriesKeys.interaction(1399), watchlisted);
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(() => useUpdateSeriesInteraction(1399), { wrapper });
  const cached = () => queryClient.getQueryData<SeriesInteraction>(seriesKeys.interaction(1399));
  return { result, cached };
};

describe("useUpdateSeriesInteraction", () => {
  it("takes a liked series off the Watchlist before the server answers, without marking it watched", async () => {
    let release: () => void = () => {};
    server.use(
      http.put("*/api/serials/1399/interaction", async () => {
        await new Promise<void>((resolve) => {
          release = resolve;
        });
        return HttpResponse.json({ ...watchlisted, liked: true, watchlisted: false });
      }),
    );
    const { result, cached } = setup();

    result.current.mutate({ liked: true });
    await waitFor(() => expect(cached()).toMatchObject({ liked: true, watchlisted: false, watched: false }));
    release();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("rolls back when the request fails", async () => {
    server.use(http.put("*/api/serials/1399/interaction", () => HttpResponse.json({ error: "nope" }, { status: 400 })));
    const { result, cached } = setup();

    result.current.mutate({ watched: true });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(cached()).toEqual(watchlisted);
  });
});
