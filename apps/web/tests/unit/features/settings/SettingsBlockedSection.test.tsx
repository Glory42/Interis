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
