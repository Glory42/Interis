import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { BookOpen } from "lucide-react";
import { renderWithProviders } from "../../../support/render/render-with-providers";
import { MediaCoverImage } from "@/features/media/components/MediaCoverImage";

const baseProps = {
  alt: "Dune cover",
  fallbackIcon: BookOpen,
  fallbackLabel: "No Cover",
  accentColor: "#ff0000",
  panelColor: "#111111",
  panelStrongColor: "#222222",
  faintColor: "#666666",
  borderColor: "#333333",
};

describe("MediaCoverImage", () => {
  it("renders the image when a src is given", async () => {
    await renderWithProviders(
      <MediaCoverImage {...baseProps} src="https://example.com/dune.jpg" />,
    );

    const img = screen.getByRole("img", { name: "Dune cover" });
    expect(img).toHaveAttribute("src", "https://example.com/dune.jpg");
    expect(screen.queryByText("No Cover")).not.toBeInTheDocument();
  });

  it("renders the fallback icon and label when there is no src", async () => {
    await renderWithProviders(<MediaCoverImage {...baseProps} src={null} />);

    expect(screen.getByText("No Cover")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});
