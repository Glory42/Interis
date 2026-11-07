import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { server } from "../../../support/msw/server";
import { renderWithProviders } from "../../../support/render/render-with-providers";
import { RegisterForm } from "@/features/auth/components/RegisterForm";

describe("RegisterForm", () => {
  it("marks the email as the login and keeps the handle out of autofill", async () => {
    renderWithProviders(<RegisterForm />, { routePath: "/register" });

    const handle = await screen.findByLabelText("Username");
    expect(handle).toHaveAttribute("autocomplete", "off");
    expect(handle).toHaveAttribute("autocapitalize", "none");
    expect(handle).toHaveAttribute("spellcheck", "false");
    expect(screen.getByText("/profile/")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toHaveAttribute("autocomplete", "username");
    const password = screen.getByLabelText("Password");
    expect(password).toHaveAttribute("autocomplete", "new-password");
    expect(password).toHaveAttribute("passwordrules", "minlength: 8; maxlength: 128;");
    expect(screen.queryByLabelText(/Confirm/)).not.toBeInTheDocument();
  });

  it("checks each field when you leave it and says what's wrong right under it", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterForm />, { routePath: "/register" });

    await user.type(await screen.findByLabelText("Username"), "films");
    await user.tab();
    expect(screen.getByText("\"films\" is reserved. Try another.")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Email"), "not-an-email");
    await user.tab();
    expect(screen.getByText("That doesn't look like an email.")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Password"), "abcde");
    expect(screen.getByText("5 / 128 · 3 more")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create account" })).toBeDisabled();
  });

  it("creates the account and moves on to the recovery question", async () => {
    const user = userEvent.setup();
    let body: unknown = null;
    server.use(
      http.post("*/api/auth/sign-up/email", async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ user: { id: "user_1" } });
      }),
    );
    const { router } = renderWithProviders(<RegisterForm />, { routePath: "/register" });

    await user.type(await screen.findByLabelText("Username"), "Cinefan");
    await user.type(screen.getByLabelText("Email"), "me@example.com");
    await user.type(screen.getByLabelText("Password"), "long-enough-1");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => expect(router.state.location.pathname).toBe("/setup-security-question"));
    expect(body).toMatchObject({ username: "cinefan", email: "me@example.com", password: "long-enough-1" });
  });
});
