import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { QueryClient } from "@tanstack/react-query";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { server } from "../../../support/msw/server";
import { renderWithProviders } from "../../../support/render/render-with-providers";
import { SettingsSessionsSection } from "@/features/settings/components/sections/SettingsSessionsSection";

const hoursAgo = (hours: number) => new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

const current = {
  id: "s_current",
  deviceLabel: "Firefox on Linux",
  ipAddressMasked: "203.0.113.*",
  createdAt: hoursAgo(48),
  lastActiveAt: hoursAgo(0),
  isCurrent: true,
};
const phone = {
  id: "s_phone",
  deviceLabel: "Safari on iPhone",
  ipAddressMasked: "198.51.100.*",
  createdAt: hoursAgo(72),
  lastActiveAt: hoursAgo(2),
  isCurrent: false,
};
const tablet = { ...phone, id: "s_tablet", deviceLabel: "Chrome on iPad", ipAddressMasked: null };

const freshClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });

// Serves the list from a mutable array so revocations show up on refetch.
const serveSessions = (initial: Array<typeof current>) => {
  let sessions = [...initial];
  const revoked: string[] = [];
  const revokeOthersBodies: unknown[] = [];
  server.use(
    http.get("*/api/auth/sessions", () => HttpResponse.json({ sessions, hasMore: false })),
    http.delete("*/api/auth/sessions/:sessionId", ({ params }) => {
      revoked.push(String(params.sessionId));
      sessions = sessions.filter((session) => session.id !== params.sessionId);
      return HttpResponse.json({ success: true });
    }),
    http.post("*/api/auth/sessions/revoke-others", async ({ request }) => {
      const body = (await request.json()) as { currentPassword: string };
      revokeOthersBodies.push(body);
      if (body.currentPassword !== "password1234") {
        return HttpResponse.json({ error: "Current password is incorrect" }, { status: 401 });
      }
      const revokedCount = sessions.filter((session) => !session.isCurrent).length;
      sessions = sessions.filter((session) => session.isCurrent);
      return HttpResponse.json({ revokedCount });
    }),
  );
  return { revoked, revokeOthersBodies };
};

describe("Where you're signed in", () => {
  it("shows each device with its masked IP and last activity, marking this one", async () => {
    serveSessions([current, phone, tablet]);
    renderWithProviders(<SettingsSessionsSection />, { queryClient: freshClient() });

    const currentRow = (await screen.findByText("Firefox on Linux")).closest("li")!;
    expect(within(currentRow).getByText("This device")).toBeInTheDocument();
    expect(within(currentRow).getByText(/203\.0\.113\.\* · Active now/)).toBeInTheDocument();
    expect(within(currentRow).queryByRole("button")).not.toBeInTheDocument();

    const phoneRow = screen.getByText("Safari on iPhone").closest("li")!;
    expect(within(phoneRow).getByText(/198\.51\.100\.\* · Active 2 hours ago/)).toBeInTheDocument();
    expect(within(phoneRow).queryByText("This device")).not.toBeInTheDocument();
    expect(within(screen.getByText("Chrome on iPad").closest("li")!).getByText(/^Active 2 hours ago/)).toBeInTheDocument();
  });

  it("signs out one other device and drops it from the list", async () => {
    const { revoked } = serveSessions([current, phone, tablet]);
    const user = userEvent.setup();
    renderWithProviders(<SettingsSessionsSection />, { queryClient: freshClient() });

    await user.click(await screen.findByRole("button", { name: "Sign out Safari on iPhone" }));

    await waitFor(() => expect(screen.queryByText("Safari on iPhone")).not.toBeInTheDocument());
    expect(revoked).toEqual(["s_phone"]);
    expect(screen.getByText("Chrome on iPad")).toBeInTheDocument();
    expect(screen.getByText("Signed out that device.")).toBeInTheDocument();
  });

  it("asks for the current password before signing out every other session", async () => {
    const { revokeOthersBodies } = serveSessions([current, phone, tablet]);
    const user = userEvent.setup();
    renderWithProviders(<SettingsSessionsSection />, { queryClient: freshClient() });

    await user.click(await screen.findByRole("button", { name: "Sign out all other sessions" }));
    const dialog = screen.getByRole("dialog", { name: "Sign out all other sessions?" });
    const confirm = within(dialog).getByRole("button", { name: "Sign out others" });
    expect(confirm).toBeDisabled();

    await user.type(within(dialog).getByLabelText("Current password"), "wrong-password");
    await user.click(confirm);
    expect(await within(dialog).findByText("Current password is incorrect")).toBeInTheDocument();
    expect(screen.getByText("Safari on iPhone")).toBeInTheDocument();

    const password = within(dialog).getByLabelText("Current password");
    await user.clear(password);
    await user.type(password, "password1234");
    await user.click(confirm);

    expect(await screen.findByText("Signed out 2 other sessions.")).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText("Safari on iPhone")).not.toBeInTheDocument());
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Sign out all other sessions" })).not.toBeInTheDocument();
    expect(revokeOthersBodies).toEqual([{ currentPassword: "wrong-password" }, { currentPassword: "password1234" }]);
  });
});
