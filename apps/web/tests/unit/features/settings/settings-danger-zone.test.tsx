import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { QueryClient } from "@tanstack/react-query";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { server } from "../../../support/msw/server";
import { renderWithProviders } from "../../../support/render/render-with-providers";
import { authKeys } from "@/features/auth/hooks/useAuth";
import { SettingsDangerZone } from "@/features/settings/components/sections/SettingsDangerZone";

const signedIn = () => {
  // Keeps unobserved queries, so the signed-out user stays readable.
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  queryClient.setQueryData(authKeys.me, { id: "user_1", username: "cinefan", email: "me@example.com" });
  queryClient.setQueryData(["profile", "detail", "cinefan"], { username: "cinefan" });
  return queryClient;
};

describe("SettingsDangerZone", () => {
  it("says what goes, and lets a password manager fill the confirmation", async () => {
    renderWithProviders(<SettingsDangerZone />, { routePath: "/settings/data", queryClient: signedIn() });

    expect(await screen.findByText(/Deletes @cinefan with every log, review, list, post and comment/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Download your diary first." })).toHaveAttribute("href", "/settings/data");
    const password = screen.getByLabelText("Your password, to confirm");
    expect(password).toHaveAttribute("autocomplete", "current-password");
    expect(document.querySelector('input[autocomplete="username"]')).toHaveValue("cinefan");
    expect(screen.getByRole("button", { name: "Delete @cinefan forever" })).toBeDisabled();
  });

  it("sends the current password, then signs out and goes home", async () => {
    let body: unknown = null;
    server.use(
      http.delete("*/api/auth/account", async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ success: true });
      }),
    );
    const user = userEvent.setup();
    const queryClient = signedIn();
    const { router } = renderWithProviders(<SettingsDangerZone />, { routePath: "/settings/data", queryClient });

    await user.type(await screen.findByLabelText("Your password, to confirm"), "password1234");
    await user.click(screen.getByRole("button", { name: "Delete @cinefan forever" }));

    await waitFor(() => expect(router.state.location.pathname).toBe("/"));
    expect(body).toEqual({ currentPassword: "password1234" });
    expect(queryClient.getQueryData(authKeys.me)).toBeNull();
    expect(queryClient.getQueryData(["profile", "detail", "cinefan"])).toBeUndefined();
  });

  it("keeps everything and says so when the password is wrong", async () => {
    server.use(
      http.delete("*/api/auth/account", () => HttpResponse.json({ error: "Current password is incorrect" }, { status: 401 })),
    );
    const user = userEvent.setup();
    const { router } = renderWithProviders(<SettingsDangerZone />, { routePath: "/settings/data", queryClient: signedIn() });

    await user.type(await screen.findByLabelText("Your password, to confirm"), "wrong-password");
    await user.click(screen.getByRole("button", { name: "Delete @cinefan forever" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Current password is incorrect. Nothing was deleted.");
    expect(router.state.location.pathname).toBe("/settings/data");
  });
});
