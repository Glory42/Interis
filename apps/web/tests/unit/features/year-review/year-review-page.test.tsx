import { afterEach, describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient } from "@tanstack/react-query";
import { server } from "../../../support/msw/server";
import { renderWithProviders } from "../../../support/render/render-with-providers";
import { authKeys } from "@/features/auth/hooks/useAuth";
import { YearReviewPage } from "@/features/year-review/pages/YearReviewPage";
import type { YearReview } from "@/features/year-review/api";
import { emptyYear, fullYear, thinYear } from "./year-review-fixtures";

const NOW = new Date(2026, 10, 16);

const serve = (review: YearReview | null) =>
  server.use(
    http.get("*/api/users/glory42/year/:year", () =>
      review ? HttpResponse.json(review) : HttpResponse.json({ error: "User not found" }, { status: 404 }),
    ),
  );

const signedInAs = (username: string) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  queryClient.setQueryData(authKeys.me, { id: "x", username });
  return queryClient;
};

const sectionNames = () => screen.queryAllByRole("region").map((region) => region.getAttribute("aria-label"));

describe("YearReviewPage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("runs a full year as a sequence of sections", async () => {
    serve(fullYear());
    renderWithProviders(<YearReviewPage username="glory42" year={2025} now={NOW} />);

    expect(await screen.findByRole("heading", { level: 1, name: "2025 in review" })).toBeInTheDocument();
    expect(screen.getByText("142")).toBeInTheDocument();
    expect(screen.getByText("351h")).toBeInTheDocument();
    expect(screen.getByText("+22 vs 2024")).toBeInTheDocument();
    expect(screen.getByText("−49 vs 2024")).toBeInTheDocument();
    expect(sectionNames()).toEqual(["Rhythm", "Taste", "Ratings", "Words & people", "Watch goal"]);

    expect(screen.getByRole("heading", { name: "March was the busiest month: 23 logs." })).toBeInTheDocument();
    expect(screen.getByText("6 days")).toBeInTheDocument();
    expect(screen.getByText("Mar 10 – Mar 15")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Opening Night/ })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "2025 in reels: 3 logs" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Drama led the way, in 40 titles." })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ada Lens" })).toBeInTheDocument();
    expect(screen.getByText("1990s")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Rated 7.8 on average, kinder than the community's 7.1." }),
    ).toBeInTheDocument();
    expect(screen.getByText("10.0 / 10")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Comfort Film/ })).toHaveTextContent("4 watches");
    expect(screen.getByText("“Every frame earns its place.”")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Goal reached: 142 films against 100." })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Year" })).toHaveTextContent("202620252024");
    expect(screen.getByRole("link", { name: "2025" })).toHaveAttribute("aria-current", "page");
  });

  it("keeps a thin year short: headline numbers and its titles, no charts", async () => {
    serve(thinYear());
    renderWithProviders(<YearReviewPage username="glory42" year={2025} now={NOW} />);

    expect(await screen.findByRole("heading", { name: "A quiet year." })).toBeInTheDocument();
    expect(sectionNames()).toEqual(["The year in titles"]);
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Perfect Film/ })).toBeInTheDocument();
    expect(screen.queryByRole("group", { name: /in reels/ })).not.toBeInTheDocument();
  });

  it("gives an empty year one line instead of a page of zeros", async () => {
    serve(emptyYear());
    renderWithProviders(<YearReviewPage username="glory42" year={2025} now={NOW} />, { queryClient: signedInAs("glory42") });

    expect(await screen.findByText("Nothing logged in 2025 yet. Every Diary Entry dated in 2025 lands here.")).toBeInTheDocument();
    expect(sectionNames()).toEqual([]);
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });

  it("reads the current year as so far and tells visitors when nothing is logged", async () => {
    serve(emptyYear());
    server.use(
      http.get("*/api/users/glory42/year/:year", () => HttpResponse.json({ ...emptyYear(), year: 2026, isPartialYear: true })),
    );
    renderWithProviders(<YearReviewPage username="glory42" year={2026} now={NOW} />);
    expect(await screen.findByRole("heading", { level: 1, name: "2026 so far" })).toBeInTheDocument();
    expect(screen.getByText("Glory hasn't logged anything in 2026.")).toBeInTheDocument();
  });

  it("says so when the recap isn't available", async () => {
    serve(null);
    renderWithProviders(<YearReviewPage username="glory42" year={2025} now={NOW} />);
    expect(await screen.findByText("This year in review isn't available.")).toBeInTheDocument();
  });

  it("copies the recap link to share it", async () => {
    serve(fullYear());
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue(undefined);
    renderWithProviders(<YearReviewPage username="glory42" year={2025} now={NOW} />);

    await user.click(await screen.findByRole("button", { name: "Share" }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/profile/glory42/year/2025`));
    expect(screen.getByRole("button", { name: "Link copied" })).toBeInTheDocument();
  });
});
