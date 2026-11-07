import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { server } from "../../../support/msw/server";
import { renderWithProviders } from "../../../support/render/render-with-providers";
import { SettingsBlockedSection } from "@/features/settings/components/sections/SettingsBlockedSection";

const moderated = (n: number) => ({
  id: `user-${n}`,
  username: `blocked${n}`,
  displayUsername: null,
  avatarUrl: null,
  createdAt: "2026-11-02T12:00:00.000Z",
});

describe("SettingsBlockedSection", () => {
  it("loads more blocked users when the first page is full", async () => {
    const user = userEvent.setup();
    const offsets: (string | null)[] = [];
    server.use(
      http.get("http://localhost/api/moderation/blocked", ({ request }) => {
        const offset = new URL(request.url).searchParams.get("offset");
        offsets.push(offset);
        return HttpResponse.json(
          offset === "25" ? [moderated(26)] : Array.from({ length: 25 }, (_, i) => moderated(i + 1)),
        );
      }),
      http.get("http://localhost/api/moderation/muted", () => HttpResponse.json([])),
    );

    renderWithProviders(<SettingsBlockedSection />);

    expect(await screen.findByText("@blocked25")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Load more blocked users" }));

    expect(await screen.findByText("@blocked26")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Load more blocked users" })).not.toBeInTheDocument();
    expect(offsets).toEqual(["0", "25"]);
  });
});

describe("SettingsBlockedSection as one list", () => {
  it("shows blocked or muted, one at a time, with when each happened", async () => {
    const user = userEvent.setup();
    server.use(
      http.get("http://localhost/api/moderation/blocked", () => HttpResponse.json([moderated(1), moderated(2)])),
      http.get("http://localhost/api/moderation/muted", () =>
        HttpResponse.json([{ ...moderated(3), username: "spoilerbot", createdAt: "2026-09-03T12:00:00.000Z" }]),
      ),
    );
    const { container } = renderWithProviders(<SettingsBlockedSection />);

    expect(await screen.findByText("@blocked1")).toBeInTheDocument();
    await screen.findByRole("button", { name: /blocked \(2\)/ });
    expect(container).toHaveTextContent("Showing blocked (2) · muted (1)");
    expect(screen.getAllByText("Blocked Nov 2")).toHaveLength(2);
    expect(screen.queryByText("@spoilerbot")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /blocked \(2\)/ }));
    await user.click(screen.getByRole("menuitemradio", { name: "Muted (1)" }));

    expect(screen.getByText("@spoilerbot")).toBeInTheDocument();
    expect(screen.getByText("Muted Sep 3")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Unmute" })).toBeInTheDocument();
    expect(screen.queryByText("@blocked1")).not.toBeInTheDocument();
    expect(container).toHaveTextContent("Muted people don't know they're muted.");
  });
});
