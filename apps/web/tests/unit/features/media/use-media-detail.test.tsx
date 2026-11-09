import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { server } from "../../../support/msw/server";
import { authKeys } from "@/features/auth/hooks/useAuth";
import { useMediaDetail } from "@/features/media/detail/use-media-detail";
import { interactionKeys } from "@/features/interactions/hooks/interaction-keys";
import type { InteractionState, MediaKind } from "@/features/media/media-cache";
import { seriesKeys } from "@/features/tv/hooks/tv/query-keys";

const TMDB_ID = 550;
const path = (kind: MediaKind) => (kind === "film" ? `*/api/interactions/${TMDB_ID}` : `*/api/serials/${TMDB_ID}/interaction`);
const key = (kind: MediaKind) => (kind === "film" ? interactionKeys.detail(TMDB_ID) : seriesKeys.interaction(TMDB_ID));

const blank: InteractionState = { liked: false, watchlisted: false, rating: null, watched: false, watchStatus: null };

// Records each Interaction write and holds its answer until released.
const holdWrites = (kind: MediaKind) => {
  const sent: unknown[] = [];
  let release: () => void = () => {};
  server.use(
    http.put(path(kind), async ({ request }) => {
      sent.push(await request.json());
      await new Promise<void>((resolve) => {
        release = resolve;
      });
      return HttpResponse.json(blank);
    }),
    http.get(path(kind), () => HttpResponse.json(blank)),
  );
  return { sent, release: () => release() };
};

const setup = (kind: MediaKind, interaction: InteractionState, userRating: { rating: number | null } | null = null) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity }, mutations: { retry: false } },
  });
  queryClient.setQueryData(authKeys.me, { id: "user-1", username: "cinefan" });
  queryClient.setQueryData(key(kind), interaction);
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return renderHook(() => useMediaDetail(kind, TMDB_ID, userRating), { wrapper });
};

const toggle = (actionKey: string, result: { current: ReturnType<typeof useMediaDetail> }) =>
  act(() => result.current.actions.find((action) => action.key === actionKey)!.onToggle());

describe.each<MediaKind>(["film", "tv"])("useMediaDetail (%s)", (kind) => {
  it("reads Your Rating from the Interaction, else the latest rated log", () => {
    expect(setup(kind, { ...blank, rating: 7 }, { rating: 4 }).result.current.yourRating).toBe(7);
    expect(setup(kind, blank, { rating: 4 }).result.current.yourRating).toBe(4);
  });

  it("lists watched, liked and watchlist toggles from the Interaction", () => {
    const { result } = setup(kind, { ...blank, liked: true });
    expect(result.current.actions.map((action) => [action.key, action.isActive])).toEqual([
      ["watched", false],
      ["liked", true],
      ["watchlist", false],
    ]);
  });

  it("stays busy while a write is in flight", async () => {
    const { release } = holdWrites(kind);
    const { result } = setup(kind, blank);
    expect(result.current.isBusy).toBe(false);

    await toggle("watchlist", result);
    await waitFor(() => expect(result.current.isBusy).toBe(true));
    release();
    await waitFor(() => expect(result.current.isBusy).toBe(false));
  });

  it("asks before unwatching a liked title, and can clear the like and rating", async () => {
    const { sent, release } = holdWrites(kind);
    const { result } = setup(kind, { ...blank, liked: true, watched: true });

    await toggle("watched", result);
    expect(sent).toEqual([]);
    expect(result.current.unwatchConfirmation).not.toBeNull();

    act(() => result.current.unwatchConfirmation!.onConfirm(true));
    await waitFor(() => expect(sent).toEqual([{ watched: false, liked: false, rating: null }]));
    expect(result.current.unwatchConfirmation).toBeNull();
    release();
  });

  it("unwatches right away when nothing is liked or rated", async () => {
    const { sent, release } = holdWrites(kind);
    const { result } = setup(kind, { ...blank, watched: true });

    await toggle("watched", result);
    await waitFor(() => expect(sent).toEqual([{ watched: false }]));
    expect(result.current.unwatchConfirmation).toBeNull();
    release();
  });
});
