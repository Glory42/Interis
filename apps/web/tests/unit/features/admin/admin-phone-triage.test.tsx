import { afterEach, describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { server } from "../../../support/msw/server";
import { renderWithProviders } from "../../../support/render/render-with-providers";
import { AdminReportsPanel } from "@/features/admin/components/AdminReportsPanel";

const row = {
  targetType: "post",
  targetId: "p1",
  reportCount: 2,
  reasons: ["spam"],
  contentSnapshot: "free 4k streams here",
  authorUsername: "freestreamz",
  oldestReportAt: new Date(Date.now() - 2 * 3_600_000).toISOString(),
  reportId: "r9",
  reports: [
    { reporterUsername: "mira_k", reason: "spam", details: null },
    { reporterUsername: "tobi", reason: "spam", details: null },
  ],
};

const asPhone = () =>
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: query.includes("max-width"),
    addEventListener: () => {},
    removeEventListener: () => {},
  }));

afterEach(() => vi.unstubAllGlobals());

describe("report triage on a phone", () => {
  it("opens each item's actions in a bottom sheet from a visible ⋯", async () => {
    const user = userEvent.setup();
    asPhone();
    server.use(http.get("http://localhost/api/reports/grouped", () => HttpResponse.json([row])));
    renderWithProviders(<AdminReportsPanel status="pending" onStatusChange={() => {}} />);

    await user.click(await screen.findByRole("button", { name: "Actions for Post · free 4k streams here" }));
    const sheet = screen.getByRole("dialog", { name: "Post · 2 reports" });
    expect(within(sheet).getByRole("button", { name: "Remove & resolve 2" })).toBeInTheDocument();
    expect(within(sheet).getByRole("button", { name: "Dismiss 2" })).toBeInTheDocument();
    expect(within(sheet).getByRole("button", { name: "Suspend @freestreamz…" })).toBeInTheDocument();
    expect(within(sheet).getByRole("link", { name: "Open @freestreamz" })).toHaveAttribute("href", "/admin/users/freestreamz");
  });

  it("keeps the status switch and a refresh in a sticky bottom bar", async () => {
    const user = userEvent.setup();
    asPhone();
    let requests = 0;
    server.use(
      http.get("http://localhost/api/reports/grouped", () => {
        requests += 1;
        return HttpResponse.json([row]);
      }),
    );
    const onStatusChange = vi.fn();
    renderWithProviders(<AdminReportsPanel status="pending" onStatusChange={onStatusChange} />);

    const bar = await screen.findByRole("toolbar", { name: "Report status" });
    await user.click(within(bar).getByRole("button", { name: "resolved" }));
    expect(onStatusChange).toHaveBeenCalledWith("resolved");
    await user.click(within(bar).getByRole("button", { name: "↻ Refresh" }));
    await vi.waitFor(() => expect(requests).toBe(2));
  });
});

describe("report triage on desktop", () => {
  it("offers to suspend the author from the opened item", async () => {
    const user = userEvent.setup();
    server.use(http.get("http://localhost/api/reports/grouped", () => HttpResponse.json([row])));
    renderWithProviders(<AdminReportsPanel status="pending" onStatusChange={() => {}} />);

    await user.click(await screen.findByRole("button", { name: /Post · free 4k streams here/ }));
    expect(screen.getByRole("button", { name: "Suspend @freestreamz…" })).toBeInTheDocument();
  });
});
