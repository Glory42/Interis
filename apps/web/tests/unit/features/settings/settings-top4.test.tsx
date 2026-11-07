import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient } from "@tanstack/react-query";
import { server } from "../../../support/msw/server";
import { renderWithProviders } from "../../../support/render/render-with-providers";
import { authKeys } from "@/features/auth/hooks/useAuth";
import { SettingsFavoritesSection } from "@/features/settings/components/sections/SettingsFavoritesSection";

const pick = (slot: number, tmdbId: number, title: string) => ({
  slot,
  mediaType: "movie",
  mediaSource: "tmdb",
  mediaSourceId: String(tmdbId),
  entityId: null,
  tmdbId,
  title,
  posterPath: null,
  releaseYear: 1999,
});

const signedIn = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  queryClient.setQueryData(authKeys.me, { id: "user_1", username: "cinefan", email: "me@example.com", isAdmin: false, hasSecurityQuestion: true });
  return queryClient;
};

const serveTopPicks = () => {
  const saved: unknown[] = [];
  server.use(
    http.get("*/api/users/cinefan/top4", () =>
      HttpResponse.json({
        categories: [
          { id: 1, key: "movie", supported: true, items: [pick(1, 550, "Fight Club"), pick(2, 13, "Forrest Gump")] },
          { id: 2, key: "serial", supported: true, items: [] },
        ],
      }),
    ),
    http.put("*/api/users/me", async ({ request }) => {
      saved.push(await request.json());
      return HttpResponse.json({ userId: "user_1", isAdmin: false, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" });
    }),
  );
  return saved;
};

describe("Top 4", () => {
  it("shows films and series as numbered poster slots, with empty ones asking to add", async () => {
    serveTopPicks();
    renderWithProviders(<SettingsFavoritesSection />, { queryClient: signedIn() });

    expect(await screen.findByText("Films · 2/4")).toBeInTheDocument();
    expect(screen.getByText("Series · 0/4")).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: "Fight Club, film 01 actions" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add a film to slot 03" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add a series to slot 01" })).toBeInTheDocument();
    expect(screen.queryByText(/Movie #/)).not.toBeInTheDocument();
  });

  it("moves a pick from its ⋯ menu, says what changed, and saves the new order", async () => {
    const user = userEvent.setup();
    const saved = serveTopPicks();
    renderWithProviders(<SettingsFavoritesSection />, { queryClient: signedIn() });

    await user.click(await screen.findByRole("button", { name: "Fight Club, film 01 actions" }));
    const menu = screen.getByRole("menu");
    expect(within(menu).getByRole("menuitem", { name: "Move left" })).toBeDisabled();
    await user.click(within(menu).getByRole("menuitem", { name: "Move right" }));

    expect(screen.getByText("Order changed: 01 ⇄ 02")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Save top 4" }));

    await screen.findByText("Top 4 saved.");
    const body = saved[0] as { topPicks: { categoryId: number; items: { slot: number; mediaSourceId: string }[] }[] };
    expect(body.topPicks[0]!.items.map((item) => [item.slot, item.mediaSourceId])).toEqual([
      [1, "13"],
      [2, "550"],
    ]);
  });

  it("removes a pick and can discard the change", async () => {
    const user = userEvent.setup();
    serveTopPicks();
    renderWithProviders(<SettingsFavoritesSection />, { queryClient: signedIn() });

    await user.click(await screen.findByRole("button", { name: "Forrest Gump, film 02 actions" }));
    await user.click(screen.getByRole("menuitem", { name: "Remove from Top 4" }));
    expect(screen.getByText("Films · 1/4")).toBeInTheDocument();
    expect(screen.getByText("1 unsaved change")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Discard" }));
    expect(screen.getByText("Films · 2/4")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save top 4" })).toBeDisabled();
  });
});
