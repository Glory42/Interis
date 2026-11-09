import { describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient } from "@tanstack/react-query";
import { server } from "../../../support/msw/server";
import { renderWithProviders } from "../../../support/render/render-with-providers";
import { authKeys } from "@/features/auth/hooks/useAuth";
import { GlobalSearchDialog } from "@/features/search/components/GlobalSearchDialog";

const title = (mediaType: "movie" | "tv", tmdbId: number, name: string) => ({
  mediaType,
  tmdbId,
  title: name,
  posterPath: null,
  releaseDate: "2008-01-20",
  popularity: 10,
  credit: null,
});

const member = (id: string, username: string) => ({ id, username, displayUsername: null, avatarUrl: null });

const status = (mediaType: "movie" | "tv", tmdbId: number, marks: { watched?: boolean; watchlisted?: boolean; rating?: number | null }) => ({
  mediaType,
  tmdbId,
  watched: marks.watched ?? false,
  rating: marks.rating ?? null,
  liked: false,
  watchlisted: marks.watchlisted ?? false,
  episodes: null,
});

const serve = (onStatus = vi.fn(), onFollows = vi.fn()) =>
  server.use(
    http.get("*/api/search", () =>
      HttpResponse.json([title("movie", 77, "Breaking Away"), title("tv", 1396, "Breaking Bad"), title("movie", 78, "Breaking Glass")]),
    ),
    http.get("*/api/users", () => HttpResponse.json([member("u_walt", "walt"), member("u_jesse", "jesse")])),
    http.get("*/api/viewer-status", ({ request }) => {
      onStatus(new URL(request.url).searchParams.get("items"));
      return HttpResponse.json({
        items: [
          status("movie", 77, { watched: true, rating: 8.5 }),
          status("tv", 1396, { watchlisted: true }),
          status("movie", 78, {}),
        ],
      });
    }),
    http.get("*/api/social/following-status", ({ request }) => {
      onFollows(new URL(request.url).searchParams.get("userIds"));
      return HttpResponse.json({ followingIds: ["u_jesse"] });
    }),
  );

describe("the viewer's marks in global search", () => {
  it("shows watched, watchlisted, your score and who you follow, from one batched request each", async () => {
    const user = userEvent.setup();
    const onStatus = vi.fn();
    const onFollows = vi.fn();
    serve(onStatus, onFollows);
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    queryClient.setQueryData(authKeys.me, { id: "user_1", username: "cinefan" });
    renderWithProviders(<GlobalSearchDialog isOpen onOpenChange={vi.fn()} />, { queryClient });

    await user.type(await screen.findByPlaceholderText("Films, shows, members"), "breaking");

    const away = await screen.findByRole("option", { name: /Breaking Away/ });
    expect(await within(away).findByLabelText("Watched")).toBeInTheDocument();
    expect(within(away).getByLabelText("8.5 of 10")).toBeInTheDocument();

    const bad = screen.getByRole("option", { name: /Breaking Bad/ });
    expect(within(bad).getByLabelText("On your watchlist")).toBeInTheDocument();
    expect(within(bad).queryByLabelText("Watched")).not.toBeInTheDocument();

    const glass = screen.getByRole("option", { name: /Breaking Glass/ });
    expect(within(glass).queryByLabelText("Watched")).not.toBeInTheDocument();

    expect(await within(screen.getByRole("option", { name: /jesse/ })).findByText("Following")).toBeInTheDocument();
    expect(within(screen.getByRole("option", { name: /walt/ })).queryByText("Following")).not.toBeInTheDocument();

    expect(onStatus).toHaveBeenLastCalledWith("movie:77,movie:78,tv:1396");
    expect(onFollows).toHaveBeenLastCalledWith("u_jesse,u_walt");
  });

  it("asks for nothing when signed out", async () => {
    const user = userEvent.setup();
    const onStatus = vi.fn();
    const onFollows = vi.fn();
    serve(onStatus, onFollows);
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    queryClient.setQueryData(authKeys.me, null);
    renderWithProviders(<GlobalSearchDialog isOpen onOpenChange={vi.fn()} />, { queryClient });

    await user.type(await screen.findByPlaceholderText("Films, shows, members"), "breaking");

    expect(await screen.findByRole("option", { name: /Breaking Away/ })).toBeInTheDocument();
    expect(await screen.findByRole("option", { name: /jesse/ })).toBeInTheDocument();
    expect(screen.queryByText("Following")).not.toBeInTheDocument();
    expect(onStatus).not.toHaveBeenCalled();
    expect(onFollows).not.toHaveBeenCalled();
  });
});
