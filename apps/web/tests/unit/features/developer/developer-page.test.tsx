import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { server } from "../../../support/msw/server";
import { renderWithProviders } from "../../../support/render/render-with-providers";
import { DeveloperPage } from "@/features/developer/pages/DeveloperPage";

describe("DeveloperPage", () => {
  it("states the terms up front and gives a full base URL", async () => {
    renderWithProviders(<DeveloperPage />, { routePath: "/developer" });

    expect(await screen.findByRole("heading", { level: 1, name: "Your diary, on your own site." })).toBeInTheDocument();
    expect(screen.getByText("GET only · No key · 60 req/min/IP · Cached 5 min")).toBeInTheDocument();
    expect(screen.getByText("http://localhost/api/public/:username")).toBeInTheDocument();
    expect(screen.queryByText("Portfolio Widget")).not.toBeInTheDocument();
  });

  it("credits TMDB as its terms require", async () => {
    renderWithProviders(<DeveloperPage />, { routePath: "/developer" });

    expect(
      await screen.findByText("This product uses the TMDB API but is not endorsed or certified by TMDB."),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "TMDB" })).toHaveAttribute("href", "https://www.themoviedb.org");
  });

  it("lists every endpoint with its default and maximum limit", async () => {
    renderWithProviders(<DeveloperPage />, { routePath: "/developer" });

    const endpoints = await screen.findByRole("list", { name: "Endpoints" });
    expect(within(endpoints).getAllByRole("listitem")).toHaveLength(13);
    const reviews = within(endpoints).getByText("/reviews").closest("li")!;
    expect(reviews).toHaveTextContent("50 / 200");
    const recent = within(endpoints).getByText("/recent").closest("li")!;
    expect(recent).toHaveTextContent("10 / 20");
    const top4 = within(endpoints).getByText("/top4").closest("li")!;
    expect(top4).toHaveTextContent("—");
  });

  it("builds a pasteable snippet from the sentence and previews the real response", async () => {
    const user = userEvent.setup();
    server.use(http.get("*/api/public/glory42/diary", () => HttpResponse.json([{ media: { title: "Clayface" } }])));
    renderWithProviders(<DeveloperPage />, { routePath: "/developer" });

    const name = await screen.findByLabelText("Username");
    await user.clear(name);
    await user.type(name, "glory42");
    const entries = screen.getByLabelText("Entries");
    await user.clear(entries);
    await user.type(entries, "4");

    expect(screen.getByTestId("snippet")).toHaveTextContent('fetch("http://localhost/api/public/glory42/diary?limit=4")');
    await user.click(screen.getByRole("tab", { name: "curl" }));
    expect(screen.getByTestId("snippet")).toHaveTextContent('curl "http://localhost/api/public/glory42/diary?limit=4"');

    await user.click(screen.getByRole("button", { name: "Run it" }));
    expect(await screen.findByText(/"title": "Clayface"/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /recently watched/ }));
    await user.click(screen.getByRole("menuitemradio", { name: "Currently watching" }));
    expect(screen.getByTestId("snippet")).toHaveTextContent("http://localhost/api/public/glory42/serials/currently-watching?limit=4");
  });
});
