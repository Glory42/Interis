import { afterEach, describe, expect, it, vi } from "vitest";
import { act, screen } from "@testing-library/react";
import { renderWithProviders } from "../../support/render/render-with-providers";
import { PrimaryNavLinks } from "@/components/layout/navbar/parts/PrimaryNavLinks";
import { primaryNavItems } from "@/components/layout/navbar/navbar.constants";
import { NotFoundPage } from "@/components/layout/NotFoundPage";
import { GlobalSearchDialogProvider } from "@/features/search/components/GlobalSearchDialogProvider";

afterEach(() => vi.restoreAllMocks());

describe("app shell", () => {
  it("labels the main links Feed, Films and TV and marks the current one", async () => {
    renderWithProviders(<PrimaryNavLinks items={primaryNavItems} />, {
      routePath: "/movies",
    });

    expect(await screen.findByRole("link", { name: "Films" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Feed" })).not.toHaveAttribute("aria-current");
    expect(screen.getByRole("link", { name: "TV" })).toBeInTheDocument();
  });

  it("slides one marker under the current link, in that section's colour, as the page changes", async () => {
    const layout: Record<string, number> = { Feed: 0, Films: 80, TV: 160 };
    vi.spyOn(HTMLElement.prototype, "offsetLeft", "get").mockImplementation(function (this: HTMLElement) {
      return layout[this.textContent ?? ""] ?? 0;
    });
    vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockReturnValue(48);
    const { router } = renderWithProviders(<PrimaryNavLinks items={primaryNavItems} />, {
      routePath: "/$",
      initialPath: "/movies",
    });

    const marker = await screen.findByTestId("nav-marker");
    expect(marker).toHaveStyle({ transform: "translateX(80px)", width: "48px", background: "var(--film)" });

    await act(() => router.navigate({ to: "/$", params: { _splat: "serials" } }));
    expect(marker).toHaveStyle({ transform: "translateX(160px)", background: "var(--series)" });
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
