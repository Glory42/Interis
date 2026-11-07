import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient } from "@tanstack/react-query";
import { server } from "../../../support/msw/server";
import { renderWithProviders } from "../../../support/render/render-with-providers";
import { authKeys } from "@/features/auth/hooks/useAuth";
import { ProfileListDetailPage } from "@/features/profile/pages/ProfileListDetailPage";

const listDetail = {
  id: "l1",
  userId: "user_1",
  title: "Rewatch every winter",
  description: "The ones I put on when it gets dark at five.",
  isRanked: true,
  isPublic: true,
  derivedType: "movie",
  createdAt: "2026-10-01T10:00:00.000Z",
  updatedAt: "2026-11-01T10:00:00.000Z",
  itemCount: 2,
  likeCount: 2,
  likedByViewer: false,
  items: [
    { id: "i1", position: 1, itemType: "movie", note: "Every December, without fail.", tmdbId: 550, title: "Fight Club", posterPath: null, releaseYear: 1999, ownerRating: 9, credit: "David Fincher" },
    { id: "i2", position: 2, itemType: "movie", note: null, tmdbId: 13, title: null, posterPath: null, releaseYear: null, ownerRating: null, credit: null },
  ],
};

const signedInAs = (id: string, username: string) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  queryClient.setQueryData(authKeys.me, { id, username });
  return queryClient;
};

describe("ProfileListDetailPage", () => {
  it("reads like a ranked list with notes, credits and the owner's rockets", async () => {
    server.use(http.get("*/api/lists/l1", () => HttpResponse.json(listDetail)));
    const { container } = renderWithProviders(<ProfileListDetailPage username="glory42" listId="l1" />, {
      queryClient: signedInAs("u9", "viewer"),
    });

    expect(await screen.findByRole("heading", { name: "Rewatch every winter" })).toBeInTheDocument();
    expect(screen.getByText("List · Ranked · 2 films · Public")).toBeInTheDocument();
    expect(screen.getByText("By glory42 · Updated Nov 1")).toBeInTheDocument();

    const first = screen.getByRole("listitem", { name: /Fight Club/ });
    expect(within(first).getByText("01")).toBeInTheDocument();
    expect(within(first).getByText("1999 · David Fincher")).toBeInTheDocument();
    expect(within(first).getByText("“Every December, without fail.”")).toBeInTheDocument();
    expect(within(first).getByLabelText("9 of 10")).toBeInTheDocument();

    expect(screen.getByText("Title no longer available")).toBeInTheDocument();
    expect(container).not.toHaveTextContent("Unknown");
    expect(screen.getByRole("button", { name: "Like this list" })).toHaveTextContent("Like · 2");
  });

  it("asks before deleting, from the owner's ⋯ menu", async () => {
    const user = userEvent.setup();
    let deleted = false;
    server.use(
      http.get("*/api/lists/l1", () => HttpResponse.json(listDetail)),
      http.delete("*/api/lists/l1", () => {
        deleted = true;
        return HttpResponse.json({ success: true });
      }),
    );
    renderWithProviders(<ProfileListDetailPage username="cinefan" listId="l1" />, {
      queryClient: signedInAs("user_1", "cinefan"),
    });

    await user.click(await screen.findByRole("button", { name: "List actions" }));
    await user.click(screen.getByRole("menuitem", { name: "Delete" }));
    expect(deleted).toBe(false);
    await user.click(await screen.findByRole("button", { name: "Delete list" }));
    await expect.poll(() => deleted).toBe(true);
  });
});
