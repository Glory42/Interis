import { describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { server } from "../../../support/msw/server";
import { renderWithProviders } from "../../../support/render/render-with-providers";
import { AdminReportsPanel } from "@/features/admin/components/AdminReportsPanel";

describe("AdminReportsPanel status", () => {
  it("loads reports for the status it's given and reports status changes", async () => {
    const user = userEvent.setup();
    const statuses: (string | null)[] = [];
    server.use(
      http.get("http://localhost/api/reports/grouped", ({ request }) => {
        statuses.push(new URL(request.url).searchParams.get("status"));
        return HttpResponse.json([]);
      }),
    );
    const onStatusChange = vi.fn();
    renderWithProviders(<AdminReportsPanel status="dismissed" onStatusChange={onStatusChange} />);

    await waitFor(() => expect(statuses).toContain("dismissed"));
    await user.click(screen.getByRole("button", { name: /resolved/i }));
    expect(onStatusChange).toHaveBeenCalledWith("resolved");
  });
});
