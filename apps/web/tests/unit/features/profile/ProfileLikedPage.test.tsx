import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { server } from "../../../support/msw/server";
import { renderWithProviders } from "../../../support/render/render-with-providers";
import { ProfileLikedPage } from "@/features/profile/pages/ProfileLikedPage";

const likedItem = (tmdbId: number, title: string, mediaType: "movie" | "tv") => ({
  tmdbId,
  title,
  posterPath: null,
  releaseYear: 2020,
  runtime: null,
  genres: null,
  mediaType,
  lastInteractionAt: "2026-02-01T12:00:00.000Z",
});

describe("ProfileLikedPage", () => {
  it("counts every like, not just the loaded page, and filters on the server", async () => {
    const user = userEvent.setup();
    const types: (string | null)[] = [];
    server.use(
      http.get("http://localhost/api/users/cinephile/likes", ({ request }) => {
        const type = new URL(request.url).searchParams.get("type");
        types.push(type);
        const counts = { movie: 90, tv: 4 };
        return HttpResponse.json(
          type === "movie"
            ? { items: [likedItem(1, "Loved Film", "movie")], total: 90, counts }
            : { items: [likedItem(2, "Loved Show", "tv")], total: 94, counts },
        );
      }),
      http.get("http://localhost/api/users/cinephile/liked-reviews", () => HttpResponse.json([])),
      http.get("http://localhost/api/users/cinephile/liked-lists", () => HttpResponse.json([])),
    );

    const { container } = renderWithProviders(<ProfileLikedPage username="cinephile" />);

    expect(await screen.findByText("Loved Show")).toBeInTheDocument();
    expect(container).toHaveTextContent("Showing 94 liked titles · films and series.");
    await user.click(screen.getByRole("button", { name: /films and series/ }));
    await user.click(screen.getByRole("menuitemradio", { name: "Films · 90" }));

    expect(await screen.findByText("Loved Film")).toBeInTheDocument();
    expect(types).toEqual(["all", "movie"]);
  });
});
