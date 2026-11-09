import { beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { applyMediaEvent, refreshAfter, type MediaEvent } from "@/features/media/media-cache";
import { useUpdateFilmInteraction } from "@/features/interactions/hooks/useInteractions";
import { useDeleteReview } from "@/features/reviews/hooks/useDeleteReview";
import { useUpdateReview } from "@/features/reviews/hooks/useReviews";
import {
  useDeleteEpisodeReview,
  useMarkWatchedThrough,
  useUpdateEpisodeInteraction,
  useUpdateSeasonInteraction,
  useUpdateSeriesInteraction,
  useUpsertSeasonReview,
} from "@/features/tv/hooks/useTv";

vi.mock("@/features/media/media-cache", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/media/media-cache")>()),
  applyMediaEvent: vi.fn(() => Promise.resolve(() => {})),
  refreshAfter: vi.fn(() => Promise.resolve()),
}));
vi.mock("@/features/interactions/api", () => ({
  updateFilmInteraction: vi.fn(() => Promise.resolve({})),
}));
vi.mock("@/features/reviews/api", () => ({
  deleteReview: vi.fn(() => Promise.resolve()),
  updateReview: vi.fn(() =>
    Promise.resolve({
      id: "review-1",
      content: "New",
      containsSpoilers: false,
      updatedAt: "2026-01-01T00:00:00.000Z",
      mediaType: "tv",
      mediaSourceId: "1399",
    }),
  ),
}));
vi.mock("@/features/tv/api", () => ({
  updateSeriesInteraction: vi.fn(() => Promise.resolve({})),
  updateSeasonInteraction: vi.fn(() => Promise.resolve({})),
  updateEpisodeInteraction: vi.fn(() => Promise.resolve({})),
  markEpisodesWatchedThrough: vi.fn(() => Promise.resolve({})),
  upsertSeasonReview: vi.fn(() => Promise.resolve({})),
  deleteEpisodeReview: vi.fn(() => Promise.resolve({})),
}));

const run = async <T,>(useHook: () => { mutateAsync: (input: T) => Promise<unknown> }, input: T) => {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(useHook, { wrapper });
  await act(() => result.current.mutateAsync(input));
  return vi.mocked(refreshAfter).mock.calls.map(([, event]) => event);
};

// Each mutation hook hands its change to the media cache, so the table tests cover what it patches and refreshes.
// Log create, edit and delete are covered at the Log Editor (log-editor.test.tsx).
describe("mutation hooks fire one media event", () => {
  beforeEach(() => {
    vi.mocked(refreshAfter).mockClear();
    vi.mocked(applyMediaEvent).mockClear();
  });

  const cases: Array<[string, () => Promise<MediaEvent[]>, MediaEvent]> = [
    [
      "Film Interaction",
      () => run(() => useUpdateFilmInteraction(550), { liked: true }),
      { type: "interaction-changed", kind: "film", tmdbId: 550, input: { liked: true } },
    ],
    [
      "Series Interaction",
      () => run(() => useUpdateSeriesInteraction(1399), { watchlisted: true, rating: 8 }),
      { type: "interaction-changed", kind: "tv", tmdbId: 1399, input: { watchlisted: true, rating: 8 } },
    ],
    [
      "Series watch status",
      () => run(() => useUpdateSeriesInteraction(1399), { watchStatus: "paused" }),
      { type: "interaction-changed", kind: "tv", tmdbId: 1399, input: { watchStatus: "paused" } },
    ],
    [
      "season Interaction",
      () => run(() => useUpdateSeasonInteraction(1399), { seasonNumber: 2, input: { liked: true } }),
      { type: "season-interaction-changed", tmdbId: 1399, seasonNumber: 2, input: { liked: true } },
    ],
    [
      "episode Interaction",
      () => run(() => useUpdateEpisodeInteraction(1399, 2), { episodeNumber: 5, input: { watched: true } }),
      { type: "episode-interaction-changed", tmdbId: 1399, seasonNumber: 2, episodeNumber: 5, input: { watched: true } },
    ],
    [
      "episodes watched through",
      () => run(() => useMarkWatchedThrough(1399, 2), 4),
      { type: "episodes-watched-through", tmdbId: 1399, seasonNumber: 2, episodeNumber: 4 },
    ],
    [
      "review edit",
      () => run(() => useUpdateReview("review-1"), { content: "New" }),
      { type: "review-edited", title: { kind: "tv", tmdbId: 1399 } },
    ],
    [
      "review delete",
      () => run(useDeleteReview, { id: "review-1", mediaType: "movie", tmdbId: 550 }),
      { type: "review-deleted", kind: "film", tmdbId: 550 },
    ],
    [
      "season review",
      () => run(() => useUpsertSeasonReview(1399, 2), { content: "Good", containsSpoilers: false }),
      { type: "season-review-changed", tmdbId: 1399, seasonNumber: 2, episodeNumber: null },
    ],
    [
      "episode review delete",
      () => run(() => useDeleteEpisodeReview(1399, 2), { episodeNumber: 5, reviewId: "r" }),
      { type: "season-review-changed", tmdbId: 1399, seasonNumber: 2, episodeNumber: 5 },
    ],
  ];

  it.each(cases)("%s", async (_name, fire, expected) => {
    expect(await fire()).toEqual([expected]);
  });

  it("an Interaction write patches the cache with the same event it refreshes", async () => {
    await run(() => useUpdateSeriesInteraction(1399), { liked: true });
    expect(vi.mocked(applyMediaEvent).mock.calls.map(([, event]) => event)).toEqual([
      { type: "interaction-changed", kind: "tv", tmdbId: 1399, input: { liked: true } },
    ]);
  });
});
