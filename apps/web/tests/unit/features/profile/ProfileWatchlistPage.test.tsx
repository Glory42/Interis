import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { server } from "../../../support/msw/server";
import { renderWithProviders } from "../../../support/render/render-with-providers";
import { ProfileWatchlistPage } from "@/features/profile/pages/ProfileWatchlistPage";

const shelfItem = (tmdbId: number, title: string, mediaType: "movie" | "tv") => ({
  tmdbId,
  title,
  posterPath: null,
  releaseYear: 2020,
  runtime: null,
  genres: null,
  mediaType,
  lastInteractionAt: "2026-02-01T12:00:00.000Z",
});

describe("ProfileWatchlistPage", () => {
  it("shows server counts on the filters and asks the server for one media type", async () => {
    const user = userEvent.setup();
    const types: (string | null)[] = [];
    server.use(
      http.get("http://localhost/api/users/cinephile/watchlist", ({ request }) => {
        const type = new URL(request.url).searchParams.get("type");
        types.push(type);
        const counts = { movie: 70, tv: 1 };
        return HttpResponse.json(
          type === "tv"
            ? { items: [shelfItem(2, "Queued Show", "tv")], total: 1, counts }
            : { items: [shelfItem(1, "Queued Film", "movie")], total: 71, counts },
        );
      }),
    );

    renderWithProviders(<ProfileWatchlistPage username="cinephile" />);

    expect(await screen.findByText("Queued Film")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "All (71)" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Serial (1)" }));

    expect(await screen.findByText("Queued Show")).toBeInTheDocument();
    expect(screen.queryByText("Queued Film")).not.toBeInTheDocument();
    expect(types).toEqual(["all", "tv"]);
  });
});
