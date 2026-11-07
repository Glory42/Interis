import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { server } from "../../../support/msw/server";
import { AdminDiaryPanel } from "@/features/admin/components/AdminDiaryPanel";

const logRow = (mediaType: "movie" | "tv", title: string) => ({
  id: `${mediaType}-log`,
  userId: "user-1",
  authorUsername: "watcher",
  watchedDate: "2026-11-01",
  rating: 7,
  rewatch: false,
  mediaType,
  mediaId: 1,
  mediaTitle: title,
  createdAt: "2026-11-02T12:00:00.000Z",
});

// The Diary panel lists Film or Series logs and removes a row by its own media type.
describe("AdminDiaryPanel", () => {
  it("switches to Series logs and deletes one as a Series log", async () => {
    const user = userEvent.setup();
    const listed: string[] = [];
    const deleted: string[] = [];
    server.use(
      http.get("http://localhost/api/admin/diary", ({ request }) => {
        const mediaType = new URL(request.url).searchParams.get("mediaType") ?? "";
        listed.push(mediaType);
        return HttpResponse.json([
          mediaType === "tv" ? logRow("tv", "Severance") : logRow("movie", "Clayface"),
        ]);
      }),
      http.delete("http://localhost/api/admin/diary/:id", ({ request, params }) => {
        deleted.push(`${String(params.id)}?${new URL(request.url).searchParams.toString()}`);
        return HttpResponse.json({ success: true });
      }),
    );

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    render(
      <QueryClientProvider client={queryClient}>
        <AdminDiaryPanel />
      </QueryClientProvider>,
    );

    expect(await screen.findByText("Clayface")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "TV" }));
    expect(await screen.findByText("Severance")).toBeTruthy();
    expect(listed).toEqual(["movie", "tv"]);

    await user.click(screen.getByRole("button", { name: "Delete" }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Delete" }));

    await expect.poll(() => deleted).toEqual(["tv-log?mediaType=tv"]);
  });
});
