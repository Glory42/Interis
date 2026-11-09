import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { screen } from "@testing-library/react";
import { QueryClient } from "@tanstack/react-query";
import { server } from "../../../support/msw/server";
import { renderWithProviders } from "../../../support/render/render-with-providers";
import { authKeys } from "@/features/auth/hooks/useAuth";
import { ProfileStatsPage } from "@/features/profile/pages/ProfileStatsPage";

const profile = (logged: number) => ({
  id: "u1",
  username: "glory42",
  isAdmin: false,
  stats: { movieEntryCount: logged, serialEntryCount: 0, reviewCount: 85 },
});

const stats = {
  entriesPerMonth: [{ month: "2026-11", count: 4 }],
  ratingDistribution: [{ rating: 8, count: 3 }],
  topGenres: [{ genre: "Thriller", count: 198 }],
  topDirectors: [{ director: "David Fincher", count: 4, slug: "david-fincher" }],
  logsPerDay: [{ day: "2026-11-02", count: 4 }],
  averageRating: 7.4,
  ratedLogCount: 589,
  hoursWatched: 612,
};

const serve = (logged: number) =>
  server.use(
    http.get("*/api/users/glory42/stats/detailed", () => HttpResponse.json(stats)),
    http.get("*/api/users/glory42", () => HttpResponse.json(profile(logged))),
  );

const signedInAs = (username: string) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  queryClient.setQueryData(authKeys.me, { id: "x", username });
  return queryClient;
};

describe("ProfileStatsPage", () => {
  it("leads with headline numbers, a day heatmap and labelled bars", async () => {
    serve(1563);
    renderWithProviders(<ProfileStatsPage username="glory42" now={new Date(2026, 10, 7)} />);

    expect(await screen.findByText("1,563")).toBeInTheDocument();
    expect(screen.getByText("85")).toBeInTheDocument();
    expect(screen.getByText("7.4")).toBeInTheDocument();
    expect(screen.getByText("612h")).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "2026 in reels: 4 logs" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "4 logs on Mon, Nov 2" })).toHaveAttribute("title", "4 logs on Mon, Nov 2");
    expect(screen.getByLabelText("Nov: 4 logs")).toBeInTheDocument();
    expect(screen.getByLabelText("Oct: 0 logs")).toBeInTheDocument();
    // The average shares the ratings header row, so it can't push the bars down.
    expect(screen.getByText("Avg 7.4").parentElement).toContainElement(screen.getByText("Ratings · 589 rated logs"));
    expect(screen.getByRole("link", { name: /David Fincher/ })).toBeInTheDocument();
  });

  it("tells the owner how many logs are left before stats start", async () => {
    serve(2);
    renderWithProviders(<ProfileStatsPage username="glory42" />, { queryClient: signedInAs("glory42") });
    expect(await screen.findByText("3 more logs to start your stats.")).toBeInTheDocument();
  });
});
