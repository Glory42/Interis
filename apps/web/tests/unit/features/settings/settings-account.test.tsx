import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient } from "@tanstack/react-query";
import { server } from "../../../support/msw/server";
import { renderWithProviders } from "../../../support/render/render-with-providers";
import { authKeys } from "@/features/auth/hooks/useAuth";
import { SettingsAuthSection } from "@/features/settings/components/sections/SettingsAuthSection";

const signedIn = (hasSecurityQuestion = true) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  queryClient.setQueryData(authKeys.me, { id: "user_1", username: "cinefan", email: "me@example.com", isAdmin: false, hasSecurityQuestion });
  return queryClient;
};

const capture = (method: "post" | "put" | "patch", path: string) => {
  const bodies: unknown[] = [];
  server.use(
    http[method](`*${path}`, async ({ request }) => {
      bodies.push(await request.json());
      return HttpResponse.json({ success: true });
    }),
  );
  return bodies;
};

describe("Account & security", () => {
  it("lists email, password and recovery question, with every form closed", async () => {
    renderWithProviders(<SettingsAuthSection />, { queryClient: signedIn() });

    expect(await screen.findByText("m•@example.com")).toBeInTheDocument();
    expect(screen.getByText("Set")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Change email" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Change password" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Replace recovery question" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Current password")).not.toBeInTheDocument();
  });

  it("opens one form at a time", async () => {
    const user = userEvent.setup();
    renderWithProviders(<SettingsAuthSection />, { queryClient: signedIn() });

    await user.click(await screen.findByRole("button", { name: "Change email" }));
    expect(screen.getByLabelText("New email")).toHaveValue("");
    await user.click(screen.getByRole("button", { name: "Change password" }));
    expect(screen.queryByLabelText("New email")).not.toBeInTheDocument();
    expect(screen.getByLabelText("New password")).toBeInTheDocument();
    expect(screen.queryByLabelText(/Confirm/)).not.toBeInTheDocument();
  });

  it("changes the password without a confirm field, counting toward the minimum", async () => {
    const user = userEvent.setup();
    const bodies = capture("post", "/api/auth/change-password");
    renderWithProviders(<SettingsAuthSection />, { queryClient: signedIn() });

    await user.click(await screen.findByRole("button", { name: "Change password" }));
    await user.type(screen.getByLabelText("Current password"), "old-password-1");
    await user.type(screen.getByLabelText("New password"), "short");
    expect(screen.getByText("5 / 128 · 3 more")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save new password" })).toBeDisabled();

    await user.type(screen.getByLabelText("New password"), "-but-long");
    expect(screen.getByText("14 / 128 · OK")).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Sign me out on my other devices" })).toBeChecked();
    await user.click(screen.getByRole("button", { name: "Save new password" }));

    await screen.findByText("Password changed.");
    expect(bodies[0]).toEqual({ currentPassword: "old-password-1", newPassword: "short-but-long", revokeOtherSessions: true });
  });

  it("replaces the recovery question with the current password", async () => {
    const user = userEvent.setup();
    const bodies = capture("post", "/api/auth/security-question");
    renderWithProviders(<SettingsAuthSection />, { queryClient: signedIn(true) });

    await user.click(await screen.findByRole("button", { name: "Replace recovery question" }));
    await user.type(screen.getByLabelText("Question"), "First cinema?");
    await user.type(screen.getByLabelText("Answer"), "Odeon");
    await user.type(screen.getByLabelText("Current password"), "old-password-1");
    await user.click(screen.getByRole("button", { name: "Save question" }));

    await screen.findByText("Recovery question saved.");
    expect(bodies[0]).toEqual({ question: "First cinema?", answer: "Odeon", currentPassword: "old-password-1" });
  });
});
