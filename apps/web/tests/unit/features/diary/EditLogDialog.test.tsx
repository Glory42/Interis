import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { server } from "../../../support/msw/server";
import { EditLogDialog, type EditableLog } from "@/features/diary/components/EditLogDialog";

const movieLog: EditableLog = {
  id: "entry-1",
  mediaType: "movie",
  tmdbId: 550,
  title: "Fight Club",
  watchedDate: "2026-01-15",
  rating: 8,
  rewatch: false,
  hasReview: true,
};

const renderDialog = (log: EditableLog, onClose: () => void) => {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <EditLogDialog isOpen onClose={onClose} log={log} />
    </QueryClientProvider>,
  );
};

describe("EditLogDialog", () => {
  it("saves only the changed fields of a movie log", async () => {
    let body: unknown = null;
    server.use(
      http.put("*/api/diary/entry-1", async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ id: "entry-1" });
      }),
    );
    const user = userEvent.setup();
    let closed = false;
    renderDialog(movieLog, () => {
      closed = true;
    });

    expect(screen.getByRole("button", { name: "save" })).toBeDisabled();
    await user.click(screen.getByRole("checkbox", { name: /watched this before/i }));
    await user.click(screen.getByRole("button", { name: "save" }));

    await waitFor(() => expect(closed).toBe(true));
    expect(body).toEqual({ rewatch: true });
  });

  it("deletes a series log after confirming, keeping its review", async () => {
    let deleted = false;
    let requestUrl = "";
    server.use(
      http.delete("*/api/serials/logs/entry-2", ({ request }) => {
        deleted = true;
        requestUrl = request.url;
        return HttpResponse.json({ success: true, unwatched: false });
      }),
    );
    const user = userEvent.setup();
    let closed = false;
    renderDialog({ ...movieLog, id: "entry-2", mediaType: "tv", title: "Dark" }, () => {
      closed = true;
    });

    await user.click(screen.getByRole("button", { name: /delete log/i }));
    expect(screen.getByText("The review you wrote with it stays on your profile.")).toBeInTheDocument();
    expect(deleted).toBe(false);

    await user.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(closed).toBe(true));
    expect(deleted).toBe(true);
    expect(requestUrl).not.toContain("unwatch");
  });

  it("asks the server to mark the movie not watched when that box is ticked", async () => {
    let requestUrl = "";
    server.use(
      http.delete("*/api/diary/entry-1", ({ request }) => {
        requestUrl = request.url;
        return HttpResponse.json({ success: true, unwatched: true });
      }),
    );
    const user = userEvent.setup();
    renderDialog(movieLog, () => {});

    await user.click(screen.getByRole("button", { name: /delete log/i }));
    await user.click(screen.getByRole("checkbox", { name: /also mark as not watched/i }));
    await user.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => expect(requestUrl).toContain("?unwatch=true"));
  });

  it("asks the server to unmark the series and its episodes when that box is ticked", async () => {
    let requestUrl = "";
    server.use(
      http.delete("*/api/serials/logs/entry-2", ({ request }) => {
        requestUrl = request.url;
        return HttpResponse.json({ success: true, unwatched: true });
      }),
    );
    const user = userEvent.setup();
    renderDialog({ ...movieLog, id: "entry-2", mediaType: "tv", title: "Dark" }, () => {});

    await user.click(screen.getByRole("button", { name: /delete log/i }));
    await user.click(screen.getByRole("checkbox", { name: /unmark the series and its episodes/i }));
    await user.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => expect(requestUrl).toContain("?unwatch=true"));
  });

  it("stays open and shows the error when the delete fails", async () => {
    server.use(
      http.delete("*/api/diary/entry-1", () =>
        HttpResponse.json({ error: "Diary entry not found" }, { status: 404 }),
      ),
    );
    const user = userEvent.setup();
    let closed = false;
    renderDialog(movieLog, () => {
      closed = true;
    });

    await user.click(screen.getByRole("button", { name: /delete log/i }));
    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(await screen.findByText("Diary entry not found")).toBeInTheDocument();
    expect(closed).toBe(false);
  });
});
