import { afterEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../support/render/render-with-providers";
import { MobileTabBar } from "@/components/layout/navbar/parts/MobileTabBar";

afterEach(() => vi.restoreAllMocks());

describe("MobileTabBar", () => {
  it("gives a signed-in viewer Feed, Films, TV and You, with no Log shortcut", async () => {
    renderWithProviders(<MobileTabBar username="glory42" />, {
      routePath: "/movies",
    });

    const nav = await screen.findByRole("navigation", { name: "Sections" });
    expect(nav).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Films" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "TV" })).toHaveAttribute("href", "/serials");
    expect(screen.getByRole("link", { name: "You" })).toHaveAttribute("href", "/profile/glory42");
    expect(screen.queryByRole("button", { name: "Log" })).not.toBeInTheDocument();
  });

  it("offers Sign in to visitors instead of You", async () => {
    renderWithProviders(<MobileTabBar username={null} />);

    expect(await screen.findByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/login");
    expect(screen.queryByRole("link", { name: "You" })).not.toBeInTheDocument();
  });

  it("slides a marker along its top edge to the current tab, in that section's colour", async () => {
    const layout: Record<string, number> = { Feed: 0, Films: 100, TV: 200, You: 300 };
    vi.spyOn(HTMLElement.prototype, "offsetLeft", "get").mockImplementation(function (this: HTMLElement) {
      return layout[this.textContent ?? ""] ?? 0;
    });
    vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockReturnValue(100);
    renderWithProviders(<MobileTabBar username="glory42" />, { routePath: "/serials" });

    expect(await screen.findByTestId("tab-marker")).toHaveStyle({ transform: "translateX(200px)", background: "var(--series)" });
  });
});
