import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { server } from "../../../support/msw/server";
import type { AdminUser } from "@/features/admin/api";
import { UserRowActions } from "@/features/admin/components/AdminUserRowActions";

const target: AdminUser = {
  id: "user-2",
  username: "reel_drifter",
  displayUsername: null,
  avatarUrl: null,
  email: "reel@example.com",
  isAdmin: false,
  isSuspended: false,
  createdAt: new Date("2026-01-01T00:00:00Z"),
};

const renderRow = (user: AdminUser, viewerUsername: string) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <UserRowActions user={user} viewerUsername={viewerUsername} />
    </QueryClientProvider>,
  );
};

const captureBody = (method: "post" | "delete", path: string) => {
  const captured: { body: unknown } = { body: undefined };
  server.use(
    http[method](`http://localhost${path}`, async ({ request }) => {
      captured.body = await request.json();
      return HttpResponse.json({ success: true });
    }),
  );
  return captured;
};

describe("admin user row actions", () => {
  it("asks for your password when resetting someone's password and sends both", async () => {
    const user = userEvent.setup();
    const captured = captureBody("post", "/api/admin/users/reel_drifter/reset-password");
    renderRow(target, "glory42");

    await user.click(screen.getByRole("button", { name: "Reset password" }));
    const dialog = within(screen.getByRole("dialog", { name: "Reset password" }));
    const newPassword = dialog.getByLabelText("New password");
    expect(newPassword).toHaveAttribute("type", "password");
    await user.type(newPassword, "brand-new-password-1");
    await user.type(dialog.getByLabelText("Your password"), "admin-secret-1");
    await user.click(dialog.getByRole("button", { name: "Reset password" }));

    await waitFor(() =>
      expect(captured.body).toEqual({
        newPassword: "brand-new-password-1",
        adminPassword: "admin-secret-1",
      }),
    );
  });

  it("asks for your password when suspending and sends it with the reason", async () => {
    const user = userEvent.setup();
    const captured = captureBody("post", "/api/admin/users/reel_drifter/suspend");
    renderRow(target, "glory42");

    await user.click(screen.getByRole("button", { name: "Suspend" }));
    const dialog = within(screen.getByRole("dialog", { name: "Suspend account" }));
    await user.type(dialog.getByPlaceholderText("Reason (optional)"), "spam links");
    await user.type(dialog.getByLabelText("Your password"), "admin-secret-1");
    await user.click(dialog.getByRole("button", { name: "Suspend" }));

    await waitFor(() =>
      expect(captured.body).toEqual({ reason: "spam links", adminPassword: "admin-secret-1" }),
    );
  });

  it("asks for your password when granting admin access and sends it", async () => {
    const user = userEvent.setup();
    const captured = captureBody("post", "/api/admin/users/reel_drifter/promote");
    renderRow(target, "glory42");

    await user.click(screen.getByRole("button", { name: "Promote" }));
    const dialog = within(screen.getByRole("dialog", { name: "Grant admin access" }));
    await user.type(dialog.getByLabelText("Your password"), "admin-secret-1");
    await user.click(dialog.getByRole("button", { name: "Promote" }));

    await waitFor(() => expect(captured.body).toEqual({ adminPassword: "admin-secret-1" }));
  });

  it("offers no account actions on your own row", () => {
    renderRow({ ...target, username: "glory42", isAdmin: true }, "glory42");

    for (const name of ["Reset password", "Demote", "Suspend", "Delete"]) {
      expect(screen.queryByRole("button", { name })).not.toBeInTheDocument();
    }
  });

  it("asks for the username and your password before deleting, and sends the password", async () => {
    const user = userEvent.setup();
    const captured = captureBody("delete", "/api/admin/users/reel_drifter");
    renderRow(target, "glory42");

    await user.click(screen.getByRole("button", { name: "Delete" }));
    const dialog = within(screen.getByRole("dialog", { name: "Delete account" }));
    await user.type(dialog.getByPlaceholderText("reel_drifter"), "reel_drifter");
    await user.type(dialog.getByLabelText("Your password"), "admin-secret-1");
    await user.click(dialog.getByRole("button", { name: "Delete" }));

    await waitFor(() => expect(captured.body).toEqual({ adminPassword: "admin-secret-1" }));
  });
});
