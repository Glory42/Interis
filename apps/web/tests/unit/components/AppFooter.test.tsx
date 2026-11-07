import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../support/render/render-with-providers";
import { AppFooter } from "@/components/layout/AppFooter";

describe("AppFooter", () => {
  it("lines up with the navbar: Interis left, the motto centred, links right; no TMDB credit", async () => {
    renderWithProviders(<AppFooter />);

    const footer = await screen.findByRole("contentinfo");
    const [left, middle, right] = Array.from(footer.firstElementChild!.children);
    expect(left).toHaveTextContent("Interis");
    expect(middle).toHaveTextContent("Logged, not filtered");
    expect(right).toHaveTextContent("Developer·Docs");
    expect(screen.getByRole("link", { name: "Developer" })).toHaveAttribute("href", "/developer");
    expect(screen.queryByText(/not endorsed or certified by TMDB/)).not.toBeInTheDocument();
  });
});
