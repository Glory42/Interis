import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../../support/render/render-with-providers";
import { MediaStatsRow } from "@/features/media/components/MediaStatsRow";

const baseProps = {
  accentColor: "#ff0000",
  mutedColor: "#888888",
  faintColor: "#666666",
  borderColor: "#333333",
};

describe("MediaStatsRow", () => {
  it("shows the community rating with its count label, and the secondary stat", async () => {
    await renderWithProviders(
      <MediaStatsRow
        {...baseProps}
        primaryValue="8.4"
        primaryCountLabel="1,234 logs"
        secondaryLabel="TMDB"
        secondaryValue="7.9"
      />,
    );

    expect(screen.getByText("Community")).toBeInTheDocument();
    expect(screen.getByText("8.4")).toBeInTheDocument();
    expect(screen.getByText("1,234 logs")).toBeInTheDocument();
    expect(screen.getByText("TMDB")).toBeInTheDocument();
    expect(screen.getByText("7.9")).toBeInTheDocument();
  });
});
