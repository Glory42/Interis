import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../../support/render/render-with-providers";
import { ProfileTabEmptyState } from "@/features/profile/components/ProfileTabEmptyState";

const props = {
  visitorText: "mira hasn't logged anything yet.",
  ownerText: "Your favourites, diary and stats fill in from what you log.",
  ownerAction: { label: "✎ Log a watch", to: "/movies" as const },
};

describe("ProfileTabEmptyState", () => {
  it("gives visitors one quiet sentence and no button", async () => {
    renderWithProviders(<ProfileTabEmptyState isOwner={false} {...props} />);
    expect(await screen.findByText("mira hasn't logged anything yet.")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.queryByText(/fill in from what you log/)).not.toBeInTheDocument();
  });

  it("gives the owner one action and a hint", async () => {
    renderWithProviders(<ProfileTabEmptyState isOwner {...props} />);
    expect(await screen.findByRole("link", { name: "✎ Log a watch" })).toHaveAttribute("href", "/movies");
    expect(screen.getByText("Your favourites, diary and stats fill in from what you log.")).toBeInTheDocument();
    expect(screen.queryByText("mira hasn't logged anything yet.")).not.toBeInTheDocument();
  });

  it("falls back to the visitor sentence when the owner has nothing to do", async () => {
    renderWithProviders(<ProfileTabEmptyState isOwner visitorText="No liked reviews yet." />);
    expect(await screen.findByText("No liked reviews yet.")).toBeInTheDocument();
  });
});
