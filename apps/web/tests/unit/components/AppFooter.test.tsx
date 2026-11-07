import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../support/render/render-with-providers";
import { AppFooter } from "@/components/layout/AppFooter";

describe("AppFooter", () => {
  it("keeps to the app line and its links; the TMDB credit lives on the Developer page", async () => {
    renderWithProviders(<AppFooter />);

    expect(await screen.findByText("Interis · logged, not filtered")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Developer" })).toHaveAttribute("href", "/developer");
    expect(screen.queryByText(/not endorsed or certified by TMDB/)).not.toBeInTheDocument();
  });
});
