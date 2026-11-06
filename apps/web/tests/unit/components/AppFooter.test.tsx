import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../support/render/render-with-providers";
import { AppFooter } from "@/components/layout/AppFooter";

describe("AppFooter", () => {
  it("credits TMDB as its terms require", async () => {
    renderWithProviders(<AppFooter />);

    expect(
      await screen.findByText(
        "This product uses the TMDB API but is not endorsed or certified by TMDB.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "TMDB" })).toHaveAttribute(
      "href",
      "https://www.themoviedb.org",
    );
  });
});
