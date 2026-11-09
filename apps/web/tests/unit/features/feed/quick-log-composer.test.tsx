import { afterEach, describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { server } from "../../../support/msw/server";
import { renderWithProviders } from "../../../support/render/render-with-providers";
import { QuickLogComposer } from "@/features/feed/components/QuickLogComposer";
import type { MeProfile } from "@/types/api";

const me = { id: "u1", username: "glory42", avatarUrl: null } as MeProfile;

describe("QuickLogComposer", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("is one line with the viewer's avatar and a Log button that posts what was typed", async () => {
    const user = userEvent.setup();
    const received: unknown[] = [];
    server.use(
      http.post("*/api/posts", async ({ request }) => {
        received.push(await request.json());
        return HttpResponse.json({ id: "p1" }, { status: 201 });
      }),
    );
    renderWithProviders(<QuickLogComposer user={me} />);

    const box = await screen.findByPlaceholderText("What did you watch tonight?");
    expect(box).toHaveAttribute("rows", "1");
    const log = screen.getByRole("button", { name: "Log" });
    expect(log).toBeDisabled();

    await user.type(box, "Clayface, again");
    await user.click(log);
    await expect.poll(() => received).toEqual([{ content: "Clayface, again" }]);
  });

  it("asks a shorter question on a phone and keeps the Log button", async () => {
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: query.includes("max-width"),
      addEventListener: () => {},
      removeEventListener: () => {},
    }));
    renderWithProviders(<QuickLogComposer user={me} />);

    expect(await screen.findByRole("textbox", { name: "What did you watch?" })).toHaveAttribute("placeholder", "What did you watch?");
    expect(screen.getByRole("button", { name: "Log" })).toBeInTheDocument();
  });
});
