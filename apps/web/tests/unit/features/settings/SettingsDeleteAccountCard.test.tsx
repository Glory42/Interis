import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { QueryClient } from "@tanstack/react-query";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { server } from "../../../support/msw/server";
import { renderWithProviders } from "../../../support/render/render-with-providers";
import { authKeys } from "@/features/auth/hooks/useAuth";
import { SettingsDeleteAccountCard } from "@/features/settings/components/sections/SettingsDeleteAccountCard";

describe("SettingsDeleteAccountCard", () => {
  it("sends the current password, then signs out and goes home", async () => {
    let body: unknown = null;
    server.use(
      http.delete("*/api/auth/account", async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ success: true });
      }),
    );
    const user = userEvent.setup();
    // Keeps unobserved queries, so the signed-out user stays readable.
    const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    queryClient.setQueryData(authKeys.me, { username: "cinefan" });
    queryClient.setQueryData(["profile", "detail", "cinefan"], { username: "cinefan" });
    const { router } = renderWithProviders(<SettingsDeleteAccountCard />, {
      routePath: "/settings/auth",
      queryClient,
    });

    await user.click(await screen.findByRole("button", { name: "Delete account" }));
    const confirm = screen.getByRole("button", { name: "Delete forever" });
    expect(confirm).toBeDisabled();

    await user.type(screen.getByLabelText("Password to delete your account"), "password1234");
    await user.click(confirm);

    await waitFor(() => expect(router.state.location.pathname).toBe("/"));
    expect(body).toEqual({ currentPassword: "password1234" });
    expect(queryClient.getQueryData(authKeys.me)).toBeNull();
    expect(queryClient.getQueryData(["profile", "detail", "cinefan"])).toBeUndefined();
  });

  it("stays open and shows the error for a wrong password", async () => {
    server.use(
      http.delete("*/api/auth/account", () =>
        HttpResponse.json({ error: "Current password is incorrect" }, { status: 401 }),
      ),
    );
    const user = userEvent.setup();
    const { router } = renderWithProviders(<SettingsDeleteAccountCard />, {
      routePath: "/settings/auth",
    });

    await user.click(await screen.findByRole("button", { name: "Delete account" }));
    await user.type(screen.getByLabelText("Password to delete your account"), "wrong");
    await user.click(screen.getByRole("button", { name: "Delete forever" }));

    expect(await screen.findByText("Current password is incorrect")).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/settings/auth");
  });
});
