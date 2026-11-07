import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient } from "@tanstack/react-query";
import { renderWithProviders } from "../../../support/render/render-with-providers";
import { authKeys } from "@/features/auth/hooks/useAuth";
import { MediaActionCard } from "@/features/media/detail/MediaActionCard";
import type { MediaAction } from "@/features/media/detail/MediaActionsSidebar";
import { MOVIE_MODULE_STYLES } from "@/features/media/styles";

const signedIn = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  queryClient.setQueryData(authKeys.me, { id: "u1", username: "glory42" });
  return queryClient;
};

const action = (key: string, isActive: boolean, active: string, inactive: string, onToggle = () => {}): MediaAction => ({
  key,
  isActive,
  activeIcon: null,
  inactiveIcon: null,
  activeLabel: active,
  inactiveLabel: inactive,
  onToggle,
});

const renderCard = (overrides: Partial<Parameters<typeof MediaActionCard>[0]> = {}) =>
  renderWithProviders(
    <MediaActionCard
      moduleStyles={MOVIE_MODULE_STYLES}
      logSlot={<button type="button">Log again</button>}
      tmdbId={550}
      itemType="movie"
      viewerUsername="glory42"
      lastWatchedDate="2026-11-02"
      currentRating={8}
      onRatingChange={() => {}}
      isRatingSaving={false}
      isAuthenticated
      isInteractionBusy={false}
      actions={[
        action("watched", true, "Watched", "Watch"),
        action("liked", true, "Liked", "Like"),
        action("watchlist", false, "Watchlisted", "Watchlist"),
      ]}
      {...overrides}
    />,
    { queryClient: signedIn() },
  );

describe("MediaActionCard", () => {
  it("leads with Log, links the last watch to the diary, and sets the toggles in one row with Lists", async () => {
    const onToggle = vi.fn();
    renderCard({
      actions: [
        action("watched", true, "Watched", "Watch"),
        action("liked", false, "Liked", "Like", onToggle),
        action("watchlist", false, "Watchlisted", "Watchlist"),
      ],
    });

    expect(await screen.findByRole("button", { name: "Log again" })).toBeInTheDocument();
    expect(screen.getByText(/Watched Nov 2/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "view diary" })).toHaveAttribute("href", "/profile/glory42/diary");

    const toggles = screen.getByRole("group", { name: "Your activity" });
    expect(toggles).toHaveTextContent(/Watched.*Like.*Watchlist.*Lists/);
    await userEvent.click(screen.getByRole("button", { name: "Like" }));
    expect(onToggle).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Watched" })).toHaveAttribute("aria-pressed", "true");
  });

  it("shows the score out of 10 over a 0–10 scale, and how to clear it", async () => {
    renderCard();

    const rating = await screen.findByRole("group", { name: "Your rating" });
    expect(rating).toHaveTextContent("8/10");
    expect(rating).toHaveTextContent("0246810");
    expect(rating).toHaveTextContent("Drag or tap · saves on release · tap 8 again to clear");
    expect(screen.getByRole("slider", { name: "Rating out of 10" })).toHaveAttribute("aria-valuenow", "8");
  });

  it("asks visitors to sign in with one card instead of dead buttons", async () => {
    renderCard({ isAuthenticated: false, viewerUsername: null, currentRating: null });

    expect(await screen.findByText("Sign in to log, rate and review it.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/login");
    expect(screen.queryByRole("slider")).not.toBeInTheDocument();
  });
});
