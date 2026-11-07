import { beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { refreshAfter, type MediaEvent } from "@/features/media/media-refresh";
import { useCreateDiaryEntry } from "@/features/diary/hooks/useDiary";
import { useDeleteOwnLog, useUpdateOwnLog } from "@/features/diary/hooks/useOwnLogActions";
import { useUpdateFilmInteraction } from "@/features/interactions/hooks/useInteractions";
import { useDeleteReview } from "@/features/reviews/hooks/useDeleteReview";
import { useUpdateReview } from "@/features/reviews/hooks/useReviews";
import {
  useCreateSeriesLog,
  useDeleteEpisodeReview,
  useUpdateSeriesInteraction,
  useUpsertSeasonReview,
} from "@/features/tv/hooks/useTv";

vi.mock("@/features/media/media-refresh", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/media/media-refresh")>()),
  refreshAfter: vi.fn(() => Promise.resolve()),
}));
vi.mock("@/features/diary/api", () => ({
  createDiaryEntry: vi.fn(() => Promise.resolve({})),
  updateDiaryEntry: vi.fn(() => Promise.resolve({})),
  deleteDiaryEntry: vi.fn(() => Promise.resolve({})),
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
  createSeriesLog: vi.fn(() => Promise.resolve({})),
  updateSeriesInteraction: vi.fn(() => Promise.resolve({})),
  updateSeriesLog: vi.fn(() => Promise.resolve({})),
  deleteSeriesLog: vi.fn(() => Promise.resolve({})),
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

// Each mutation hook hands its change to refreshAfter, so the table test covers what it refreshes.
describe("mutation hooks fire one media event", () => {
  beforeEach(() => vi.mocked(refreshAfter).mockClear());

  const cases: Array<[string, () => Promise<MediaEvent[]>, MediaEvent]> = [
    [
      "Film log",
      () => run(useCreateDiaryEntry, { tmdbId: 550, watchedDate: "2026-01-01", review: "Great" }),
      { type: "log-created", kind: "film", tmdbId: 550, hasReview: true },
    ],
    [
      "Series log",
      () => run(() => useCreateSeriesLog(1399), { watchedDate: "2026-01-01" }),
      { type: "log-created", kind: "tv", tmdbId: 1399, hasReview: false },
    ],
    [
      "log edit",
      () => run(useUpdateOwnLog, { log: { id: "l", mediaType: "tv", tmdbId: 1399 }, input: { rating: 7 } }),
      { type: "log-edited", kind: "tv", tmdbId: 1399 },
    ],
    [
      "log delete",
      () => run(useDeleteOwnLog, { log: { id: "l", mediaType: "movie", tmdbId: 550 }, unwatch: true }),
      { type: "log-deleted", kind: "film", tmdbId: 550, unwatch: true },
    ],
    [
      "Film Interaction",
      () => run(() => useUpdateFilmInteraction(550), { liked: true }),
      { type: "interaction-changed", kind: "film", tmdbId: 550, changed: ["liked"] },
    ],
    [
      "Series Interaction",
      () => run(() => useUpdateSeriesInteraction(1399), { watchlisted: true, rating: 8 }),
      { type: "interaction-changed", kind: "tv", tmdbId: 1399, changed: ["watchlisted", "rating"] },
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
});
