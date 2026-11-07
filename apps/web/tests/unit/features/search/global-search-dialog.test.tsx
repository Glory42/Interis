import { describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { server } from "../../../support/msw/server";
import { renderWithProviders } from "../../../support/render/render-with-providers";
import { GlobalSearchDialog } from "@/features/search/components/GlobalSearchDialog";
import { pushRecentSearch } from "@/features/search/recent-searches";

const title = (mediaType: "movie" | "tv", tmdbId: number, name: string, releaseDate: string, credit: string | null) => ({
  mediaType,
  tmdbId,
  title: name,
  posterPath: null,
  releaseDate,
  popularity: 10,
  credit,
});

const serveSearch = (results: unknown[]) =>
  server.use(
    http.get("*/api/search", () => HttpResponse.json(results)),
    http.get("*/api/users", () => HttpResponse.json([])),
  );

describe("GlobalSearchDialog", () => {
  it("splits films and TV into sections in the order TMDB ranked them, with credits", async () => {
    const user = userEvent.setup();
    serveSearch([
      title("tv", 1396, "Breaking Bad", "2008-01-20", "Vince Gilligan"),
      title("movie", 77, "Breaking Away", "1979-07-13", "Peter Yates"),
    ]);
    renderWithProviders(<GlobalSearchDialog isOpen onOpenChange={vi.fn()} />);

    await user.type(await screen.findByPlaceholderText("Films, shows, members"), "breaking");

    const sections = await screen.findAllByRole("group");
    expect(sections.map((section) => section.getAttribute("aria-label"))).toEqual(["TV", "Films"]);
    const tv = within(sections[0]!).getByRole("option", { name: /Breaking Bad/ });
    expect(tv).toHaveTextContent("TV · 2008 · Vince Gilligan");
    expect(screen.queryByRole("group", { name: "Members" })).not.toBeInTheDocument();
    expect(screen.getByText("2 results")).toBeInTheDocument();
  });

  it("says nothing is in the reel when a search finds nothing", async () => {
    const user = userEvent.setup();
    serveSearch([]);
    renderWithProviders(<GlobalSearchDialog isOpen onOpenChange={vi.fn()} />);

    await user.type(await screen.findByPlaceholderText("Films, shows, members"), "godzila mnus");
    expect(await screen.findByText("Nothing in the reel for “godzila mnus”.")).toBeInTheDocument();
  });

  it("offers recent searches before you type, and narrows the scope with ⌘1", async () => {
    const user = userEvent.setup();
    pushRecentSearch("godzilla minus zero");
    renderWithProviders(<GlobalSearchDialog isOpen onOpenChange={vi.fn()} />);

    const input = await screen.findByPlaceholderText("Films, shows, members");
    await user.click(screen.getByRole("button", { name: "godzilla minus zero" }));
    expect(input).toHaveValue("godzilla minus zero");

    await user.keyboard("{Control>}1{/Control}");
    expect(screen.getByRole("button", { name: /films/ })).toHaveAttribute("aria-haspopup", "menu");
  });
});
