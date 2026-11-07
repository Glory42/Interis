import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import { QueryClient } from "@tanstack/react-query";
import { renderWithProviders } from "../../../support/render/render-with-providers";
import { authKeys } from "@/features/auth/hooks/useAuth";
import { SettingsLayout } from "@/features/settings/components/SettingsLayout";
import { SettingsIndex } from "@/features/settings/components/SettingsIndex";

const me = {
  id: "user_1",
  username: "cinefan",
  email: "me@example.com",
  location: "Andromeda",
  favoriteGenres: ["Drama", "Thriller"],
  themeId: "nitrate",
  isAdmin: false,
  hasSecurityQuestion: true,
};

const signedIn = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  queryClient.setQueryData(authKeys.me, me);
  return queryClient;
};

const asPhone = (isPhone: boolean) =>
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: isPhone && query.includes("max-width"),
    addEventListener: () => {},
    removeEventListener: () => {},
  }));

beforeAll(() => {
  const source = readFileSync(resolve(__dirname, "../../../../public/theme-registry.js"), "utf8");
  new Function("window", source)(window);
});

afterEach(() => vi.unstubAllGlobals());

describe("SettingsLayout on desktop", () => {
  it("numbers the sections down the side, with delete account set apart", async () => {
    renderWithProviders(<SettingsLayout>Profile form</SettingsLayout>, {
      routePath: "/settings/profile",
      queryClient: signedIn(),
    });

    const nav = await screen.findByRole("navigation", { name: "Settings sections" });
    expect(within(nav).getAllByRole("link").map((link) => link.textContent)).toEqual([
      "01Profile",
      "02Top 4",
      "03Genres",
      "04Theme",
      "05Account & security",
      "06Blocked & muted",
      "07Your data",
      "Delete account",
    ]);
    expect(within(nav).getByRole("link", { name: "01 Profile" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByText("Interis · Settings · @cinefan")).toBeInTheDocument();
    expect(screen.getByText("Profile form")).toBeInTheDocument();
  });
});

describe("SettingsLayout on a phone", () => {
  it("swaps the side list for a way back to the index", async () => {
    asPhone(true);
    renderWithProviders(<SettingsLayout>Profile form</SettingsLayout>, {
      routePath: "/settings/profile",
      queryClient: signedIn(),
    });

    expect(await screen.findByRole("link", { name: "Settings" })).toHaveAttribute("href", "/settings");
    expect(screen.queryByRole("navigation", { name: "Settings sections" })).not.toBeInTheDocument();
  });
});

describe("SettingsIndex", () => {
  it("groups every section with what it's set to now", async () => {
    renderWithProviders(<SettingsIndex />, { routePath: "/settings", queryClient: signedIn() });

    expect(await screen.findByText("Your profile")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Profile.*cinefan · Andromeda/ })).toHaveAttribute("href", "/settings/profile");
    expect(screen.getByRole("link", { name: /Genres.*Drama, Thriller/ })).toHaveAttribute("href", "/settings/genres");
    expect(screen.getByRole("link", { name: /Theme.*Nitrate/ })).toHaveAttribute("href", "/settings/theme");
    expect(screen.getByRole("link", { name: /Account & security.*m•@example.com/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Delete account" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();
  });
});
