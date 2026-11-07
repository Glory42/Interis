import { describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { server } from "../../../support/msw/server";
import { renderWithProviders } from "../../../support/render/render-with-providers";
import { AdminReportsPanel } from "@/features/admin/components/AdminReportsPanel";

const row = {
  targetType: "post",
  targetId: "p1",
  reportCount: 3,
  reasons: ["spam", "harassment"],
  contentSnapshot: "free 4k streams here",
  authorUsername: "freestreamz",
  oldestReportAt: new Date(Date.now() - (26 * 3_600_000)).toISOString(),
  latestReportAt: new Date().toISOString(),
  reportId: "r9",
  reports: [
    { reporterUsername: "mira_k", reason: "spam", details: "third time this week" },
    { reporterUsername: "tobi", reason: "spam", details: null },
    { reporterUsername: "ann", reason: "harassment", details: null },
  ],
};

const serve = () => {
  const calls: { path: string; body: unknown }[] = [];
  server.use(
    http.get("http://localhost/api/reports/grouped", () => HttpResponse.json([row])),
    http.post("http://localhost/api/reports/*", async ({ request }) => {
      calls.push({ path: new URL(request.url).pathname, body: await request.json().catch(() => null) });
      return HttpResponse.json({ success: true, closed: 3 });
    }),
  );
  return calls;
};

describe("AdminReportsPanel, one row per reported item", () => {
  it("summarises each item and opens to who reported it and why", async () => {
    const user = userEvent.setup();
    serve();
    renderWithProviders(<AdminReportsPanel status="pending" onStatusChange={() => {}} />);

    const item = await screen.findByRole("button", { name: /Post · free 4k streams here/ });
    expect(item).toHaveTextContent("3");
    expect(item).toHaveTextContent("@freestreamz");
    expect(item).toHaveTextContent("1d 2h");
    expect(screen.getByText("1 item · 3 reports")).toBeInTheDocument();

    await user.click(item);
    expect(item).toHaveAttribute("aria-expanded", "true");
    const reporters = screen.getByRole("list", { name: "Reports on this item" });
    expect(within(reporters).getAllByRole("listitem")).toHaveLength(3);
    expect(reporters).toHaveTextContent("@mira_k · spam “third time this week”");
  });

  it("removes and resolves every report at once, with the note and a notice to the author", async () => {
    const user = userEvent.setup();
    const calls = serve();
    renderWithProviders(<AdminReportsPanel status="pending" onStatusChange={() => {}} />);

    await user.click(await screen.findByRole("button", { name: /Post · free 4k streams here/ }));
    await user.type(screen.getByLabelText("Resolution note"), "spam links");
    await user.click(screen.getByRole("button", { name: "Remove & resolve 3" }));
    await user.click(screen.getByRole("button", { name: "Remove", exact: true }));

    await screen.findByText("1 item · 3 reports");
    await vi.waitFor(() => expect(calls[0]).toEqual({ path: "/api/reports/r9/remove-content", body: { reason: "spam links", notifyAuthor: true } }));
  });

  it("dismisses every report on the item with the note", async () => {
    const user = userEvent.setup();
    const calls = serve();
    renderWithProviders(<AdminReportsPanel status="pending" onStatusChange={() => {}} />);

    await user.click(await screen.findByRole("button", { name: /Post · free 4k streams here/ }));
    await user.click(screen.getByRole("button", { name: "Dismiss 3" }));

    await vi.waitFor(() => expect(calls[0]).toEqual({ path: "/api/reports/targets/post/p1/dismiss", body: { note: "" } }));
  });
});
