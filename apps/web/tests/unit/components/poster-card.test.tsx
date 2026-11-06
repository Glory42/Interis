import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { server } from "../../support/msw/server";
import { renderWithProviders } from "../../support/render/render-with-providers";
import { PosterCard } from "@/components/film/PosterCard";
import { useViewerStatuses } from "@/features/viewer-status/hooks/useViewerStatuses";

const clayface = {
  mediaType: "movie" as const,
  tmdbId: 1400940,
  title: "Clayface",
  posterPath: "/clayface.jpg",
  year: 2026,
  credit: "James Watkins",
};

const status = {
  mediaType: "movie" as const,
  tmdbId: 1400940,
  watched: true,
  rating: 8,
  liked: true,
  watchlisted: false,
  episodes: null,
};

describe("PosterCard", () => {
  it("shows your marks on the poster slate and links to the title", async () => {
    renderWithProviders(<PosterCard media={clayface} size="L" status={status} />);

    const link = await screen.findByRole("link", { name: /Clayface/ });
    expect(link).toHaveAttribute("href", "/movies/1400940");
    expect(screen.getByLabelText("Watched")).toBeInTheDocument();
    expect(screen.getByLabelText("Liked")).toBeInTheDocument();
    expect(screen.getByLabelText("Your score 8.0")).toBeInTheDocument();
    expect(screen.getByText("2026 · James Watkins")).toBeInTheDocument();
  });

  it("falls back to the TMDB score, labelled, when you have no marks", async () => {
    renderWithProviders(<PosterCard media={clayface} size="M" tmdbScore={8.34} />);

    expect(await screen.findByText("TMDB")).toBeInTheDocument();
    expect(screen.getByText("8.3")).toBeInTheDocument();
  });

  it("typesets the title when there's no poster", async () => {
    renderWithProviders(<PosterCard media={{ ...clayface, posterPath: null }} size="S" />);

    await screen.findByRole("link", { name: /Clayface/ });
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByTestId("poster-typeset")).toHaveTextContent("Clayface");
  });
});

describe("useViewerStatuses", () => {
  it("fetches every card's marks in one request, keyed by media and id", async () => {
    let requested = "";
    server.use(
      http.get("http://localhost/api/viewer-status", ({ request }) => {
        requested = new URL(request.url).searchParams.get("items") ?? "";
        return HttpResponse.json({ items: [status] });
      }),
    );
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(
      () => useViewerStatuses([{ mediaType: "tv", tmdbId: 1 }, { mediaType: "movie", tmdbId: 1400940 }]),
      { wrapper },
    );

    await waitFor(() => expect(result.current.get("movie:1400940")?.liked).toBe(true));
    expect(requested).toBe("movie:1400940,tv:1");
  });
});
