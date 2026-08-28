import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../../support/render/render-with-providers";
import { MediaRatingPanel } from "@/features/media/components/MediaRatingPanel";

const baseProps = {
  accentColor: "#ff0000",
  mutedColor: "#888888",
  borderColor: "#333333",
  panelColor: "#111111",
  faintColor: "#666666",
};

describe("MediaRatingPanel", () => {
  it("shows a sign-in link instead of the rating input when the viewer is not authenticated", async () => {
    await renderWithProviders(
      <MediaRatingPanel
        {...baseProps}
        isAuthenticated={false}
        value={null}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByText("Your Rating")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign in to rate" })).toHaveAttribute(
      "href",
      "/login",
    );
    expect(screen.queryByRole("slider")).not.toBeInTheDocument();
  });

  it("shows the rating input, seeded with the current value, when authenticated", async () => {
    await renderWithProviders(
      <MediaRatingPanel {...baseProps} isAuthenticated value={7} onChange={vi.fn()} />,
    );

    const slider = screen.getByRole("slider");
    expect(slider).toHaveAttribute("aria-valuenow", "7");
  });
});
