import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { screen, within } from "@testing-library/react";
import { server } from "../../../support/msw/server";
import { renderWithProviders } from "../../../support/render/render-with-providers";
import { LandingPage } from "@/features/landing/pages/LandingPage";

const films = Array.from({ length: 9 }, (_, index) => ({
  tmdbId: 100 + index,
  title: `Film ${index + 1}`,
  posterPath: `/f${index}.jpg`,
  releaseYear: 2026,
}));
const shows = Array.from({ length: 5 }, (_, index) => ({
  tmdbId: 200 + index,
  title: `Show ${index + 1}`,
  posterPath: null,
  firstAirYear: 2025,
}));

const serveTrending = () =>
  server.use(
    http.get("*/api/movies/trending", () => HttpResponse.json(films)),
    http.get("*/api/serials/trending", () => HttpResponse.json(shows)),
  );

describe("LandingPage", () => {
  it("says what Interis is and where to go next", async () => {
    serveTrending();
    renderWithProviders(<LandingPage />);

    expect(await screen.findByRole("heading", { level: 1, name: "Every watch, remembered." })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Start your diary, free" })[0]).toHaveAttribute("href", "/register");
    expect(screen.getAllByRole("link", { name: "Log in" })[0]).toHaveAttribute("href", "/login");
    expect(screen.getByRole("link", { name: "Browse films and TV without an account →" })).toHaveAttribute("href", "/movies");
    expect(screen.getByText("Your diary · Example")).toBeInTheDocument();
  });

  it("shows trending films as a still grid of eight, once each, and TV as a numbered list", async () => {
    serveTrending();
    renderWithProviders(<LandingPage />);

    const filmGrid = await screen.findByRole("list", { name: "Trending films" });
    const filmItems = await within(filmGrid).findAllByRole("listitem");
    expect(filmItems).toHaveLength(8);
    expect(within(filmGrid).getAllByRole("link", { name: /Film 1\b/ })).toHaveLength(1);
    expect(within(filmItems[0]!).getByText("01")).toBeInTheDocument();
    expect(within(filmGrid).queryByText("Film 9")).not.toBeInTheDocument();

    const tvList = screen.getByRole("list", { name: "Trending TV" });
    expect(within(tvList).getAllByRole("listitem")).toHaveLength(5);
    expect(within(tvList).getByRole("link", { name: /Show 1/ })).toHaveAttribute("href", "/serials/200");
  });
});
