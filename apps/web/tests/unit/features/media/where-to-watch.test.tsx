import { describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "../../../support/msw/server";
import { renderWithProviders } from "../../../support/render/render-with-providers";
import { WhereToWatch } from "@/features/media/watch-providers/WhereToWatch";
import { groupWatchProviders } from "@/features/media/watch-providers/group-watch-providers";
import { browserWatchRegion } from "@/features/media/watch-providers/watch-region";
import type { WatchProviders } from "@/features/media/watch-providers/api";

const provider = (providerId: number, name: string, displayPriority: number) => ({
  providerId,
  name,
  logoPath: `/logo-${providerId}.png`,
  displayPriority,
});

const empty: WatchProviders = { region: "US", link: null, flatrate: [], free: [], ads: [], rent: [], buy: [], availableRegions: [] };

const usProviders: WatchProviders = {
  ...empty,
  link: "https://www.themoviedb.org/movie/550/watch?locale=US",
  flatrate: [provider(8, "Streamflix", 2)],
  free: [provider(9, "Free Channel", 1)],
  ads: [provider(8, "Streamflix", 5)],
  rent: [provider(3, "Rent Store", 1)],
  availableRegions: ["GB", "US"],
};

describe("groupWatchProviders", () => {
  it("folds subscription, free and ads into Stream, once per service, by display priority", () => {
    const groups = groupWatchProviders(usProviders);

    expect(groups.map((group) => group.label)).toEqual(["Stream", "Rent"]);
    expect(groups[0]!.providers.map((item) => item.name)).toEqual(["Free Channel", "Streamflix"]);
  });

  it("returns no groups when nothing is offered", () => {
    expect(groupWatchProviders(empty)).toEqual([]);
  });
});

describe("browserWatchRegion", () => {
  it("takes the region subtag of the browser language, else US", () => {
    expect(browserWatchRegion("en-GB")).toBe("GB");
    expect(browserWatchRegion("pt-br")).toBe("BR");
    expect(browserWatchRegion("de")).toBe("US");
    expect(browserWatchRegion("not a locale!")).toBe("US");
  });
});

describe("WhereToWatch", () => {
  const serve = (byRegion: Record<string, WatchProviders>, requested: string[] = []) =>
    server.use(
      http.get("*/api/movies/:tmdbId/watch-providers", ({ request }) => {
        const region = new URL(request.url).searchParams.get("region") ?? "US";
        requested.push(region);
        return HttpResponse.json(byRegion[region] ?? { ...empty, region });
      }),
    );

  it("groups logos under Stream and Rent, each linking to TMDB's watch page, with the JustWatch credit", async () => {
    window.localStorage.setItem("interis:watch-region", "US");
    serve({ US: usProviders });
    renderWithProviders(<WhereToWatch kind="film" tmdbId={550} accent="var(--film)" />);

    const stream = await screen.findByRole("list", { name: "Stream" });
    const streamLinks = stream.querySelectorAll("a");
    expect([...streamLinks].map((link) => link.getAttribute("title"))).toEqual(["Free Channel", "Streamflix"]);
    expect(streamLinks[0]).toHaveAttribute("href", usProviders.link);
    expect(screen.getByRole("link", { name: "Rent on Rent Store" })).toBeInTheDocument();
    expect(screen.queryByRole("list", { name: "Buy" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "JustWatch" })).toBeInTheDocument();
  });

  it("renders nothing when the region has no providers", async () => {
    window.localStorage.setItem("interis:watch-region", "US");
    const requested: string[] = [];
    serve({}, requested);
    const { container } = renderWithProviders(<WhereToWatch kind="film" tmdbId={550} accent="var(--film)" />);

    await waitFor(() => expect(requested).toEqual(["US"]));
    await waitFor(() => expect(container).toBeEmptyDOMElement());
    expect(screen.queryByText("Where to watch")).not.toBeInTheDocument();
  });

  it("switches region from the picker and remembers it", async () => {
    window.localStorage.setItem("interis:watch-region", "US");
    const user = userEvent.setup();
    serve({ US: usProviders, GB: { ...empty, region: "GB", buy: [provider(4, "Buy Shop", 1)], availableRegions: ["GB", "US"] } });
    renderWithProviders(<WhereToWatch kind="film" tmdbId={550} accent="var(--film)" />);

    await user.click(await screen.findByRole("button", { name: "Region: United States" }));
    await user.click(screen.getByRole("menuitemradio", { name: /United Kingdom/ }));

    expect(await screen.findByRole("link", { name: "Buy on Buy Shop" })).toBeInTheDocument();
    expect(window.localStorage.getItem("interis:watch-region")).toBe("GB");
  });
});
