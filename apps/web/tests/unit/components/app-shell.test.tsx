import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../support/render/render-with-providers";
import { PrimaryNavLinks } from "@/components/layout/navbar/parts/PrimaryNavLinks";
import { primaryNavItems } from "@/components/layout/navbar/navbar.constants";
import { NotFoundPage } from "@/components/layout/NotFoundPage";
import { GlobalSearchDialogProvider } from "@/features/search/components/GlobalSearchDialogProvider";

describe("app shell", () => {
  it("labels the main links Feed, Films and TV and marks the current one", async () => {
    renderWithProviders(<PrimaryNavLinks items={primaryNavItems} pathname="/movies" />, {
      routePath: "/movies",
    });

    expect(await screen.findByRole("link", { name: "Films" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Feed" })).not.toHaveAttribute("aria-current");
    expect(screen.getByRole("link", { name: "TV" })).toBeInTheDocument();
  });

  it("shows the missing path on the 404 page with ways out", async () => {
    renderWithProviders(
      <GlobalSearchDialogProvider>
        <NotFoundPage />
      </GlobalSearchDialogProvider>,
      { routePath: "/movies/godzila-minus-zero" },
    );

    expect(await screen.findByRole("heading", { name: "Cut to black." })).toBeInTheDocument();
    expect(screen.getByText("/movies/godzila-minus-zero")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to home" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("button", { name: /Search/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Browse films" })).toHaveAttribute("href", "/movies");
  });
});
