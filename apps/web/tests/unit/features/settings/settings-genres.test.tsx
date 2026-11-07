import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient } from "@tanstack/react-query";
import { server } from "../../../support/msw/server";
import { renderWithProviders } from "../../../support/render/render-with-providers";
import { authKeys } from "@/features/auth/hooks/useAuth";
import { SettingsGenresSection } from "@/features/settings/components/sections/SettingsGenresSection";

const signedIn = (favoriteGenres: string[]) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  queryClient.setQueryData(authKeys.me, { id: "user_1", username: "cinefan", email: "me@example.com", favoriteGenres, isAdmin: false, hasSecurityQuestion: true });
  return queryClient;
};

const captureSaves = () => {
  const saved: unknown[] = [];
  server.use(
    http.put("*/api/users/me", async ({ request }) => {
      const body = (await request.json()) as { favoriteGenres: string[] };
      saved.push(body);
      return HttpResponse.json({ userId: "user_1", favoriteGenres: body.favoriteGenres, isAdmin: false, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" });
    }),
  );
  return saved;
};

describe("Genres", () => {
  it("reads as a sentence about your profile, with each genre listed once", async () => {
    const { container } = renderWithProviders(<SettingsGenresSection />, { queryClient: signedIn(["Science Fiction", "Drama", "Thriller"]) });

    expect(await screen.findByText(/On my profile/)).toBeInTheDocument();
    expect(container).toHaveTextContent("On my profile: I mostly watch Science Fiction, Drama and Thriller + one more.");
    expect(screen.getByText("3 / 4 picked · saves as you tap")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Drama" })).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Drama" })).toHaveAttribute("aria-pressed", "true");
  });

  it("saves each tap straight away", async () => {
    const user = userEvent.setup();
    const saved = captureSaves();
    renderWithProviders(<SettingsGenresSection />, { queryClient: signedIn(["Drama"]) });

    await user.click(await screen.findByRole("button", { name: "Horror" }));
    expect(screen.getByRole("button", { name: "Horror" })).toHaveAttribute("aria-pressed", "true");
    await screen.findByText("2 / 4 picked · saves as you tap");
    expect(saved).toEqual([{ favoriteGenres: ["Drama", "Horror"] }]);
  });

  it("stops at four by disabling the rest, not with an error", async () => {
    renderWithProviders(<SettingsGenresSection />, { queryClient: signedIn(["Drama", "Horror", "War", "Crime"]) });

    expect(await screen.findByRole("button", { name: "Comedy" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Drama" })).toBeEnabled();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
