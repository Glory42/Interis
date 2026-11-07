import { describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { server } from "../../../support/msw/server";
import { renderWithProviders } from "../../../support/render/render-with-providers";
import { AdminCommentsPanel } from "@/features/admin/components/AdminCommentsPanel";
import { AdminAuditPage } from "@/features/admin/components/AdminAuditPage";

describe("AdminCommentsPanel", () => {
  it("lists review and post comments together and deletes one", async () => {
    const user = userEvent.setup();
    let deleted: string | null = null;
    server.use(
      http.get("*/api/admin/comments", () =>
        HttpResponse.json([
          { kind: "post", id: "c1", content: "Buy cheap watches", createdAt: "2026-11-06T10:00:00.000Z", parentId: "p1", authorUsername: "spammer" },
          { kind: "review", id: "c2", content: "Nice take", createdAt: "2026-11-05T10:00:00.000Z", parentId: "r1", authorUsername: "ann" },
        ]),
      ),
      http.delete("*/api/admin/comments/:kind/:id", ({ params }) => {
        deleted = `${params.kind}/${params.id}`;
        return HttpResponse.json({ success: true });
      }),
    );
    renderWithProviders(<AdminCommentsPanel />);

    const first = (await screen.findByText("Buy cheap watches")).closest("li")!;
    expect(first).toHaveTextContent("@spammer");
    expect(first).toHaveTextContent("on a post");
    expect(screen.getByText("Nice take").closest("li")).toHaveTextContent("on a review");

    await user.click(within(first).getByRole("button", { name: "Delete comment" }));
    await user.click(screen.getByRole("button", { name: "Delete", exact: true }));
    await vi.waitFor(() => expect(deleted).toBe("post/c1"));
  });
});

describe("AdminAuditPage", () => {
  it("shows who did what, to whom and why, newest first, paged by cursor and filterable by admin", async () => {
    const user = userEvent.setup();
    const requests: string[] = [];
    server.use(
      http.get("*/api/admin/audit", ({ request }) => {
        const url = new URL(request.url);
        requests.push(url.search);
        const cursor = url.searchParams.get("cursor");
        return HttpResponse.json(
          cursor
            ? { items: [{ id: "a2", actorUsername: "glory42", action: "report.dismiss", targetType: "post", targetId: "p9", targetLabel: null, reason: "quoting a trailer", createdAt: "2026-11-06T11:02:00.000Z" }], nextCursor: null }
            : { items: [{ id: "a1", actorUsername: "glory42", action: "user.suspend", targetType: "user", targetId: "u1", targetLabel: "freestreamz", reason: "spam links", createdAt: "2026-11-06T19:30:00.000Z" }], nextCursor: "next-1" },
        );
      }),
    );
    renderWithProviders(<AdminAuditPage />);

    const row = (await screen.findByText("user.suspend")).closest("li")!;
    expect(row).toHaveTextContent("glory42");
    expect(row).toHaveTextContent("freestreamz");
    expect(row).toHaveTextContent("spam links");

    await user.click(screen.getByRole("button", { name: "Older →" }));
    expect(await screen.findByText("report.dismiss")).toBeInTheDocument();
    expect(requests.at(-1)).toContain("cursor=next-1");
    expect(screen.queryByRole("button", { name: "Older →" })).not.toBeInTheDocument();

    await user.type(screen.getByLabelText("Admin"), "glory42{Enter}");
    await vi.waitFor(() => expect(requests.at(-1)).toContain("actor=glory42"));
  });
});
