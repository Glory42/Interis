import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { BookOpen } from "lucide-react";
import { renderWithProviders } from "../../../support/render/render-with-providers";
import { ArchiveMediaCard } from "@/features/media-archive/components/ArchiveMediaCard";

const moduleStyles = {
  accent: "#ff0000",
  text: "#ffffff",
  muted: "#888888",
  faint: "#666666",
  border: "#333333",
  borderSoft: "#222222",
  panel: "#111111",
  panelSoft: "#101010",
  panelStrong: "#202020",
  badge: "#303030",
};

describe("ArchiveMediaCard", () => {
  it("links to the book detail route and shows the fallback icon/label when book kind has no cover", async () => {
    await renderWithProviders(
      <ArchiveMediaCard
        kind="book"
        id="abc123"
        title="Dune"
        imageUrl={null}
        fallbackIcon={BookOpen}
        fallbackLabel="No Cover"
        stateLabel={null}
        rating={null}
        ratingSource="user"
        subtitlePrimary="Frank Herbert"
        moduleStyles={moduleStyles}
      />,
    );

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/books/abc123");
    expect(screen.getByText("No Cover")).toBeInTheDocument();
  });

  it("links to the album detail route for album kind", async () => {
    await renderWithProviders(
      <ArchiveMediaCard
        kind="album"
        id="mbid-xyz"
        title="OK Computer"
        imageUrl="https://example.com/cover.jpg"
        fallbackIcon={BookOpen}
        fallbackLabel="No Art"
        stateLabel={null}
        rating={null}
        ratingSource="user"
        subtitlePrimary="Radiohead"
        moduleStyles={moduleStyles}
      />,
    );

    expect(screen.getByRole("link")).toHaveAttribute("href", "/music/mbid-xyz");
  });
});
