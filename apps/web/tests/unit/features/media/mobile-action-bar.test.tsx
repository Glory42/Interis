import { describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../../../support/render/render-with-providers";
import { MobileActionBar } from "@/features/media/detail/MobileActionBar";
import { MOVIE_MODULE_STYLES } from "@/features/media/styles";

const watchedAction = (onToggle = () => {}) => ({
  key: "watched",
  isActive: true,
  activeIcon: null,
  inactiveIcon: null,
  activeLabel: "Watched",
  inactiveLabel: "Watch",
  loginLabel: "Watch",
  onToggle,
});

describe("MobileActionBar", () => {
  it("keeps the title's actions in thumb reach and rates in a sheet that saves on release", async () => {
    const onRatingChange = vi.fn();
    renderWithProviders(
      <MobileActionBar
        moduleStyles={MOVIE_MODULE_STYLES}
        logSlot={<button type="button">Log</button>}
        actions={[watchedAction()]}
        currentRating={8}
        onRatingChange={onRatingChange}
        isRatingSaving={false}
        isAuthenticated
        isInteractionBusy={false}
        reviewSlot={<button type="button">Write a review</button>}
      />,
    );

    const bar = await screen.findByRole("toolbar", { name: "Title actions" });
    expect(within(bar).getByRole("button", { name: "Log" })).toBeInTheDocument();
    expect(within(bar).getByRole("button", { name: "Watched" })).toBeInTheDocument();

    await userEvent.click(within(bar).getByRole("button", { name: "Your rating 8.0" }));
    const sheet = screen.getByRole("dialog", { name: "Your rating" });
    const slider = within(sheet).getByRole("slider", { name: "Rating out of 10" });
    slider.focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(onRatingChange).toHaveBeenCalledWith(8.5);
    expect(within(sheet).getByRole("button", { name: "Write a review" })).toBeInTheDocument();
  });

  it("asks visitors to sign in instead", async () => {
    renderWithProviders(
      <MobileActionBar
        moduleStyles={MOVIE_MODULE_STYLES}
        logSlot={null}
        actions={[watchedAction()]}
        currentRating={null}
        onRatingChange={() => {}}
        isRatingSaving={false}
        isAuthenticated={false}
        isInteractionBusy={false}
      />,
    );

    expect(await screen.findByRole("link", { name: "Sign in to log and rate" })).toHaveAttribute("href", "/login");
  });
});
