import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../../support/render/render-with-providers";
import { MobileTabBar } from "@/components/layout/navbar/parts/MobileTabBar";
import { shouldShowTabBar } from "@/components/layout/navbar/navbar.constants";
import { GlobalSearchDialogContext } from "@/features/search/components/global-search-dialog-context";

const withSearch = (open: () => void, ui: React.ReactNode) => (
  <GlobalSearchDialogContext.Provider value={{ isOpen: false, open, close: () => {}, setOpen: () => {} }}>
    {ui}
  </GlobalSearchDialogContext.Provider>
);

describe("MobileTabBar", () => {
  it("gives a signed-in viewer Feed, Films, Log, TV and You", async () => {
    const open = vi.fn();
    renderWithProviders(withSearch(open, <MobileTabBar username="glory42" />), {
      routePath: "/movies",
    });

    const nav = await screen.findByRole("navigation", { name: "Sections" });
    expect(nav).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Films" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "TV" })).toHaveAttribute("href", "/serials");
    expect(screen.getByRole("link", { name: "You" })).toHaveAttribute("href", "/profile/glory42");

    await userEvent.click(screen.getByRole("button", { name: "Log" }));
    expect(open).toHaveBeenCalled();
  });

  it("offers Sign in to visitors instead of You", async () => {
    renderWithProviders(withSearch(() => {}, <MobileTabBar username={null} />));

    expect(await screen.findByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/login");
    expect(screen.queryByRole("link", { name: "You" })).not.toBeInTheDocument();
  });

  it("steps aside on film and TV detail pages and the guest landing", () => {
    expect(shouldShowTabBar("/movies", true)).toBe(true);
    expect(shouldShowTabBar("/profile/glory42/diary", true)).toBe(true);
    expect(shouldShowTabBar("/movies/550", true)).toBe(false);
    expect(shouldShowTabBar("/serials/1396/seasons/1", true)).toBe(false);
    expect(shouldShowTabBar("/", false)).toBe(false);
  });
});
