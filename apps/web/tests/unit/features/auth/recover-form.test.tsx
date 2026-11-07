import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { server } from "../../../support/msw/server";
import { renderWithProviders } from "../../../support/render/render-with-providers";
import { ForgotPasswordForm } from "@/features/auth/components/ForgotPasswordForm";

const serveRecovery = () => {
  const resets: unknown[] = [];
  server.use(
    http.post("*/api/auth/forgot-password", () => HttpResponse.json({ question: "What was the first film you watched in a cinema?" })),
    http.post("*/api/auth/reset-password", async ({ request }) => {
      resets.push(await request.json());
      return HttpResponse.json({ success: true });
    }),
  );
  return resets;
};

describe("Recover", () => {
  it("walks through three steps: email, question and new password, then done", async () => {
    const user = userEvent.setup();
    const resets = serveRecovery();
    renderWithProviders(<ForgotPasswordForm />, { routePath: "/forgot-password" });

    expect(await screen.findByText("Step 1 of 3")).toBeInTheDocument();
    await user.type(screen.getByLabelText("Email"), "me@example.com");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(await screen.findByText("Step 2 of 3")).toBeInTheDocument();
    expect(screen.getByText("m•@example.com")).toBeInTheDocument();
    expect(screen.getByText("“What was the first film you watched in a cinema?”")).toBeInTheDocument();
    const answer = screen.getByLabelText("Answer");
    expect(answer).toHaveAttribute("autocomplete", "off");
    expect(document.querySelector('input[autocomplete="username"]')).toHaveValue("me@example.com");
    expect(screen.getByLabelText("New password")).toHaveAttribute("autocomplete", "new-password");
    expect(screen.getByText("This signs you out on every device.")).toBeInTheDocument();

    await user.type(answer, "Odeon");
    await user.type(screen.getByLabelText("New password"), "brand-new-pass");
    await user.click(screen.getByRole("button", { name: "Set new password" }));

    expect(await screen.findByText("Step 3 of 3")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Password updated" })).toBeInTheDocument();
    expect(resets[0]).toEqual({ email: "me@example.com", answer: "Odeon", newPassword: "brand-new-pass" });
  });

  it("goes back to change the email", async () => {
    const user = userEvent.setup();
    serveRecovery();
    renderWithProviders(<ForgotPasswordForm />, { routePath: "/forgot-password" });

    await user.type(await screen.findByLabelText("Email"), "me@example.com");
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(await screen.findByRole("button", { name: "Change email" }));

    expect(screen.getByText("Step 1 of 3")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toHaveValue("me@example.com");
  });
});
