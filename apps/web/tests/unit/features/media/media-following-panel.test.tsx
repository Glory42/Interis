import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { QueryClient } from "@tanstack/react-query";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { server } from "../../../support/msw/server";
import { renderWithProviders } from "../../../support/render/render-with-providers";
import { authKeys } from "@/features/auth/hooks/useAuth";
import type { MediaFollowingResponse } from "@/features/media/following/api";
import { MediaFollowingPanel } from "@/features/media/following/components/MediaFollowingPanel";

const TMDB_ID = 550;

const person = (username: string, overrides: Partial<MediaFollowingResponse["people"][number]> = {}) => ({
  username,
  displayUsername: null,
  avatarUrl: null,
  liked: false,
  watched: true,
  watchStatus: null,
  rating: null,
  watchedDate: null,
  reviewId: null,
  ...overrides,
});

const respondWith = (path: string, body: MediaFollowingResponse) => {
  let calls = 0;
  server.use(
    http.get(path, () => {
      calls += 1;
      return HttpResponse.json(body);
    }),
  );
  return () => calls;
};

const signedInClient = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  queryClient.setQueryData(authKeys.me, { id: "user-1", username: "cinefan" });
  return queryClient;
};

describe("MediaFollowingPanel", () => {
  it("summarizes followees with the rocket average and opens into the list", async () => {
    respondWith(`*/api/movies/${TMDB_ID}/following`, {
      summary: { count: 2, ratedCount: 2, reviewCount: 1, averageRating: 7.25 },
      people: [
        person("ana", { rating: 8, liked: true, watchedDate: "2026-03-01", reviewId: "r-1" }),
        person("bo", { rating: 6.5 }),
      ],
      limit: 50,
    });

    renderWithProviders(<MediaFollowingPanel kind="film" tmdbId={TMDB_ID} />, {
      queryClient: signedInClient(),
    });

    const toggle = await screen.findByRole("button", { name: /2 people you follow watched this/ });
    expect(screen.getByLabelText("7.3 of 10")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Review" })).not.toBeInTheDocument();

    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("link", { name: "Review" })).toHaveAttribute("href", "/reviews/ana/r-1");
    expect(screen.getByLabelText("Liked")).toBeInTheDocument();
    expect(screen.getByLabelText("6.5 of 10")).toBeInTheDocument();
  });

  it("shows a Series followee's watch status", async () => {
    respondWith(`*/api/serials/${TMDB_ID}/following`, {
      summary: { count: 1, ratedCount: 0, reviewCount: 0, averageRating: null },
      people: [person("cy", { watched: false, watchStatus: "watching" })],
      limit: 50,
    });

    renderWithProviders(<MediaFollowingPanel kind="tv" tmdbId={TMDB_ID} />, {
      queryClient: signedInClient(),
    });

    await userEvent.click(await screen.findByRole("button", { name: /1 person you follow watch this/ }));
    expect(screen.getByText("Watching")).toBeInTheDocument();
  });

  it("renders nothing when no one the viewer follows has seen the title", async () => {
    const calls = respondWith(`*/api/movies/${TMDB_ID}/following`, {
      summary: { count: 0, ratedCount: 0, reviewCount: 0, averageRating: null },
      people: [],
      limit: 50,
    });

    const { container } = renderWithProviders(<MediaFollowingPanel kind="film" tmdbId={TMDB_ID} />, {
      queryClient: signedInClient(),
    });

    await waitFor(() => expect(calls()).toBe(1));
    expect(container.querySelector("section")).toBeNull();
  });

  it("never asks for it signed out", async () => {
    server.use(http.get("*/api/auth/me", () => HttpResponse.json(null, { status: 401 })));
    const calls = respondWith(`*/api/movies/${TMDB_ID}/following`, {
      summary: { count: 1, ratedCount: 0, reviewCount: 0, averageRating: null },
      people: [person("ana")],
      limit: 50,
    });
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    queryClient.setQueryData(authKeys.me, null);

    const { container } = renderWithProviders(<MediaFollowingPanel kind="film" tmdbId={TMDB_ID} />, {
      queryClient,
    });

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(calls()).toBe(0);
    expect(container.querySelector("section")).toBeNull();
  });
});
