import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { server } from "../../../support/msw/server";
import { diaryKeys, useCreateDiaryEntry } from "@/features/diary/hooks/useDiary";
import { authKeys } from "@/features/auth/hooks/useAuth";
import { feedKeys } from "@/features/feed/hooks/useFeed";
import { movieKeys } from "@/features/films/hooks/useMovies";
import { profileKeys } from "@/features/profile/hooks/useProfile";
import type { MeProfile, MovieLog } from "@/types/api";

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

const me: MeProfile = {
  id: "user-1",
  name: "Cinefan",
  email: "cinefan@example.com",
  username: "cinefan",
  bio: null,
  location: null,
  avatarUrl: null,
  favoriteGenres: [],
  isAdmin: false,
  hasSecurityQuestion: true,
};

const successResponse = () =>
  HttpResponse.json({
    entry: {
      id: "entry-1",
      userId: "user-1",
      movieId: 550,
      watchedDate: "2026-01-15",
      rating: 8,
      rewatch: false,
      createdAt: "2026-01-15T00:00:00.000Z",
      updatedAt: "2026-01-15T00:00:00.000Z",
    },
    movie: {
      id: 550,
      tmdbId: 550,
      title: "Fight Club",
      originalTitle: "Fight Club",
      posterPath: null,
      backdropPath: null,
      releaseDate: "1999-10-15",
      releaseYear: 1999,
      director: null,
      runtime: 139,
      overview: null,
      tagline: null,
      genres: [],
      cachedAt: "2026-01-01T00:00:00.000Z",
    },
    review: null,
  });

describe("useCreateDiaryEntry", () => {
  it("optimistically prepends a log when the current user is cached", async () => {
    server.use(http.post("*/api/diary", async () => successResponse()));

    const queryClient = createTestQueryClient();
    queryClient.setQueryData(authKeys.me, me);
    queryClient.setQueryData(movieKeys.logs(550), [] as MovieLog[]);

    const { result } = renderHook(() => useCreateDiaryEntry(), {
      wrapper: wrapperFor(queryClient),
    });

    result.current.mutate({ tmdbId: 550, watchedDate: "2026-01-15", rating: 8 });

    await waitFor(() => {
      const logs = queryClient.getQueryData<MovieLog[]>(movieKeys.logs(550));
      expect(logs).toHaveLength(1);
      expect(logs?.[0]?.username).toBe("cinefan");
      expect(logs?.[0]?.rating).toBe(8);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("skips the optimistic update entirely when the current user isn't cached yet", async () => {
    server.use(http.post("*/api/diary", async () => successResponse()));

    const queryClient = createTestQueryClient();
    queryClient.setQueryData(movieKeys.logs(550), [] as MovieLog[]);

    const { result } = renderHook(() => useCreateDiaryEntry(), {
      wrapper: wrapperFor(queryClient),
    });

    result.current.mutate({ tmdbId: 550, watchedDate: "2026-01-15" });

    // Give onMutate a tick to run - the logs array must stay empty since
    // there's no `me` in cache to build an optimistic entry from.
    await act(() => new Promise((resolve) => setTimeout(resolve, 0)));
    expect(queryClient.getQueryData<MovieLog[]>(movieKeys.logs(550))).toEqual([]);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("rolls back to the previous logs array on failure", async () => {
    server.use(
      http.post("*/api/diary", () => HttpResponse.json({ error: "nope" }, { status: 400 })),
    );

    const queryClient = createTestQueryClient();
    queryClient.setQueryData(authKeys.me, me);
    const existingLog: MovieLog = {
      diaryEntryId: "existing",
      watchedDate: "2026-01-01",
      rating: null,
      rewatch: false,
      createdAt: "2026-01-01T00:00:00.000Z",
      username: "someoneelse",
      userDisplayName: "Someone Else",
      avatarUrl: null,
      reviewContent: null,
      reviewContainsSpoilers: null,
      reviewUpdatedAt: null,
    };
    queryClient.setQueryData(movieKeys.logs(550), [existingLog]);

    const { result } = renderHook(() => useCreateDiaryEntry(), {
      wrapper: wrapperFor(queryClient),
    });

    result.current.mutate({ tmdbId: 550, watchedDate: "2026-01-15" });
    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(queryClient.getQueryData<MovieLog[]>(movieKeys.logs(550))).toEqual([existingLog]);
  });

  it("removes the logs query entirely on failure when there was nothing cached before the optimistic insert", async () => {
    server.use(
      http.post("*/api/diary", () => HttpResponse.json({ error: "nope" }, { status: 400 })),
    );

    const queryClient = createTestQueryClient();
    queryClient.setQueryData(authKeys.me, me);
    // Deliberately no pre-existing movieKeys.logs(550) entry.

    const { result } = renderHook(() => useCreateDiaryEntry(), {
      wrapper: wrapperFor(queryClient),
    });

    result.current.mutate({ tmdbId: 550, watchedDate: "2026-01-15" });
    await waitFor(() => expect(result.current.isError).toBe(true));

    // Must not be left with a stale single-optimistic-entry array.
    expect(queryClient.getQueryState(movieKeys.logs(550))).toBeUndefined();
  });

  it("invalidates only this movie's own logs/detail-view, the current user's diary/profile keys - not a different movie or user", async () => {
    server.use(http.post("*/api/diary", async () => successResponse()));

    const queryClient = createTestQueryClient();
    queryClient.setQueryData(authKeys.me, me);
    queryClient.setQueryData(movieKeys.logs(550), [] as MovieLog[]);
    queryClient.setQueryData(diaryKeys.myLogs, [] as MovieLog[]);
    queryClient.setQueryData([...movieKeys.detailViewRoot(550), "recent"], { tmdbId: 550 });
    queryClient.setQueryData(profileKeys.detail("cinefan"), { username: "cinefan" });
    queryClient.setQueryData(profileKeys.recentActivity("cinefan", 20), []);

    // Unrelated movie and unrelated user's cache must not be touched.
    queryClient.setQueryData(movieKeys.logs(999), [] as MovieLog[]);
    queryClient.setQueryData(profileKeys.detail("someone-else"), { username: "someone-else" });

    const { result } = renderHook(() => useCreateDiaryEntry(), {
      wrapper: wrapperFor(queryClient),
    });

    result.current.mutate({ tmdbId: 550, watchedDate: "2026-01-15" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(queryClient.getQueryState(diaryKeys.myLogs)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(movieKeys.logs(550))?.isInvalidated).toBe(true);
    expect(
      queryClient.getQueryState([...movieKeys.detailViewRoot(550), "recent"])?.isInvalidated,
    ).toBe(true);
    expect(queryClient.getQueryState(profileKeys.detail("cinefan"))?.isInvalidated).toBe(true);
    expect(
      queryClient.getQueryState(profileKeys.recentActivity("cinefan", 20))?.isInvalidated,
    ).toBe(true);

    expect(queryClient.getQueryState(movieKeys.logs(999))?.isInvalidated).toBe(false);
    expect(queryClient.getQueryState(profileKeys.detail("someone-else"))?.isInvalidated).toBe(
      false,
    );
  });

  it("invalidates the following feed so the new watch/review shows up for followers", async () => {
    server.use(http.post("*/api/diary", async () => successResponse()));

    const queryClient = createTestQueryClient();
    queryClient.setQueryData(authKeys.me, me);
    queryClient.setQueryData(feedKeys.followingRoot, { pages: [], pageParams: [] });

    const { result } = renderHook(() => useCreateDiaryEntry(), {
      wrapper: wrapperFor(queryClient),
    });

    result.current.mutate({ tmdbId: 550, watchedDate: "2026-01-15" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(queryClient.getQueryState(feedKeys.followingRoot)?.isInvalidated).toBe(true);
  });
});
