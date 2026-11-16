import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient } from "@tanstack/react-query";
import { server } from "../../../support/msw/server";
import { renderWithProviders } from "../../../support/render/render-with-providers";
import { authKeys } from "@/features/auth/hooks/useAuth";
import { WatchGoalCard } from "@/features/profile/components/goal/WatchGoalCard";
import { WatchGoalCompact } from "@/features/profile/components/goal/WatchGoalCompact";
import { FeedGoalReached } from "@/features/feed/components/FeedGoalReached";
import type { WatchGoal } from "@/features/profile/goal-api";

const NOW = new Date(2026, 10, 16);

const goalOf = (overrides: Partial<WatchGoal> = {}): WatchGoal => ({
  year: 2026,
  today: "2026-11-16",
  goal: { targetFilms: 52, targetSeries: null },
  films: { watched: 40, target: 52, pace: { status: "ahead", expected: 46, diff: -6 } },
  series: { watched: 3, target: null, pace: null },
  reached: false,
  years: [{ year: 2026, targetFilms: 52, targetSeries: null }],
  ...overrides,
});

const NO_GOAL = goalOf({
  goal: null,
  films: { watched: 12, target: null, pace: null },
  years: [],
});

const serveGoal = (body: WatchGoal) => {
  const years: string[] = [];
  server.use(
    http.get("*/api/users/glory42/goal", ({ request }) => {
      years.push(new URL(request.url).searchParams.get("year") ?? "");
      return HttpResponse.json(body);
    }),
  );
  return years;
};

const signedInAs = (username: string) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  queryClient.setQueryData(authKeys.me, { id: "x", username });
  return queryClient;
};

describe("WatchGoalCard", () => {
  it("asks the owner to set a goal when there is none", async () => {
    serveGoal(NO_GOAL);
    renderWithProviders(<WatchGoalCard username="glory42" isOwner now={NOW} />);

    expect(await screen.findByText("12 films logged in 2026. How many will you watch?")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Set a goal" })).toBeInTheDocument();
  });

  it("shows nothing to visitors when the user has never set a goal", async () => {
    const asked = serveGoal(NO_GOAL);
    const { container } = renderWithProviders(<WatchGoalCard username="glory42" isOwner={false} now={NOW} />);

    await waitFor(() => expect(asked).toEqual(["2026"]));
    expect(container.querySelector("section")).toBeNull();
  });

  it("shows progress and pace while the year is running", async () => {
    serveGoal(goalOf({ films: { watched: 49, target: 52, pace: { status: "ahead", expected: 46, diff: 3 } } }));
    renderWithProviders(<WatchGoalCard username="glory42" isOwner={false} now={NOW} />);

    expect(await screen.findByRole("progressbar", { name: "Films: 49 of 52" })).toBeInTheDocument();
    expect(screen.getByText("3 ahead of pace")).toBeInTheDocument();
    expect(screen.getByText("49").closest("[data-goal-state]")).toHaveAttribute("data-goal-state", "in-progress");
    expect(screen.queryByRole("button", { name: "Edit goal" })).toBeNull();
  });

  it("says when the user is behind", async () => {
    serveGoal(goalOf({ films: { watched: 40, target: 52, pace: { status: "behind", expected: 46, diff: -6 } } }));
    renderWithProviders(<WatchGoalCard username="glory42" isOwner={false} now={NOW} />);

    expect(await screen.findByText("6 behind pace")).toBeInTheDocument();
    expect(screen.getByText("Behind pace")).toBeInTheDocument();
  });

  it("celebrates a reached goal, Series target included", async () => {
    serveGoal(
      goalOf({
        goal: { targetFilms: 52, targetSeries: 5 },
        films: { watched: 55, target: 52, pace: { status: "reached", expected: 52, diff: 3 } },
        series: { watched: 5, target: 5, pace: { status: "reached", expected: 5, diff: 0 } },
        reached: true,
      }),
    );
    renderWithProviders(<WatchGoalCard username="glory42" isOwner={false} now={NOW} />);

    expect(await screen.findByText("Goal reached")).toBeInTheDocument();
    expect(screen.getByText("Reached · 3 over")).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "Series: 5 of 5" })).toBeInTheDocument();
  });

  it("lets the owner set a goal inline", async () => {
    serveGoal(NO_GOAL);
    const sent: unknown[] = [];
    server.use(
      http.put("*/api/users/me/goal/2026", async ({ request }) => {
        sent.push(await request.json());
        return HttpResponse.json({ year: 2026, targetFilms: 60, targetSeries: null });
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<WatchGoalCard username="glory42" isOwner now={NOW} />, { queryClient: signedInAs("glory42") });

    await user.click(await screen.findByRole("button", { name: "Set a goal" }));
    await user.type(screen.getByRole("spinbutton", { name: "Films" }), "60");
    await user.click(screen.getByRole("button", { name: "Save goal" }));

    await waitFor(() => expect(sent).toEqual([{ targetFilms: 60, targetSeries: null }]));
  });

  it("switches to a past year's goal", async () => {
    const asked = serveGoal(
      goalOf({ years: [{ year: 2026, targetFilms: 52, targetSeries: null }, { year: 2024, targetFilms: 30, targetSeries: null }] }),
    );
    const user = userEvent.setup();
    renderWithProviders(<WatchGoalCard username="glory42" isOwner={false} now={NOW} />);

    await user.selectOptions(await screen.findByRole("combobox", { name: "Goal year" }), "2024");
    await waitFor(() => expect(asked).toContain("2024"));
  });
});

describe("WatchGoalCompact", () => {
  it("links the year's progress to the Stats page", async () => {
    serveGoal(goalOf());
    renderWithProviders(<WatchGoalCompact username="glory42" isOwner={false} now={NOW} />);

    const link = await screen.findByRole("link", { name: "2026 watch goal: 40 of 52 films" });
    expect(link).toHaveAttribute("href", "/profile/glory42/stats");
  });

  it("offers the owner a goal when there is none", async () => {
    serveGoal(NO_GOAL);
    renderWithProviders(<WatchGoalCompact username="glory42" isOwner now={NOW} />);
    expect(await screen.findByRole("link", { name: "Set a 2026 watch goal →" })).toBeInTheDocument();
  });
});

describe("FeedGoalReached", () => {
  const goal = { year: 2026, targetFilms: 10, targetSeries: null, filmsWatched: 11, seriesWatched: 0, reached: true };

  it("shows once per year, then stays away", async () => {
    window.localStorage.removeItem("interis:goal-reached:u1:2026");
    const first = renderWithProviders(<FeedGoalReached userId="u1" username="glory42" goal={goal} />);
    expect(await screen.findByRole("status", { name: "2026 goal reached" })).toHaveTextContent("11 of 10 films");
    first.unmount();

    renderWithProviders(<FeedGoalReached userId="u1" username="glory42" goal={goal} />);
    await waitFor(() => expect(screen.queryByRole("status", { name: "2026 goal reached" })).toBeNull());
  });
});
