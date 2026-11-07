import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient } from "@tanstack/react-query";
import { server } from "../../../support/msw/server";
import { renderWithProviders } from "../../../support/render/render-with-providers";
import { authKeys } from "@/features/auth/hooks/useAuth";
import { SettingsThemeSection } from "@/features/settings/components/sections/SettingsThemeSection";

const THEME_IDS = ["rose-pine", "null-log", "nitrate", "marquee"];

beforeAll(() => {
  const source = readFileSync(resolve(__dirname, "../../../../public/theme-registry.js"), "utf8");
  new Function("window", source)(window);
});

const signedIn = (themeId: string) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  queryClient.setQueryData(authKeys.me, { id: "user_1", username: "cinefan", email: "me@example.com", themeId, isAdmin: false, hasSecurityQuestion: true });
  return queryClient;
};

describe("theme tiles", () => {
  it("previews every theme in its own colours and marks the default and the current one", async () => {
    renderWithProviders(<SettingsThemeSection />, { queryClient: signedIn("null-log") });

    const tiles = await screen.findAllByRole("button", { pressed: false });
    const current = screen.getByRole("button", { pressed: true });
    expect([current, ...tiles]).toHaveLength(4);
    expect(current).toHaveAccessibleName(/NULL:\/\/LOG/);

    for (const id of THEME_IDS) {
      expect(document.querySelector(`[data-theme-preview="${id}"]`), id).not.toBeNull();
    }
    const roseTile = screen.getByRole("button", { name: /Rose Pine/ });
    expect(within(roseTile).getByText("Default")).toBeInTheDocument();
  });

  it("applies a theme the moment it's tapped and saves it", async () => {
    const user = userEvent.setup();
    let saved: unknown = null;
    server.use(
      http.put("*/api/users/me/theme", async ({ request }) => {
        saved = await request.json();
        return HttpResponse.json({ themeId: "nitrate" });
      }),
    );
    renderWithProviders(<SettingsThemeSection />, { queryClient: signedIn("rose-pine") });

    await user.click(await screen.findByRole("button", { name: /Nitrate/ }));
    expect(document.documentElement).toHaveAttribute("data-theme-id", "nitrate");
    expect(await screen.findByText("Theme saved.")).toBeInTheDocument();
    expect(saved).toEqual({ themeId: "nitrate" });
  });
});

describe("theme tokens", () => {
  it("lets a preview tile take any theme's colours, not only the page root", () => {
    const css = readFileSync(resolve(__dirname, "../../../../src/index.css"), "utf8");
    for (const id of THEME_IDS) {
      expect(css, id).toMatch(new RegExp(`\\[data-theme-preview="${id}"\\][^{]*\\{`));
    }
  });
});
