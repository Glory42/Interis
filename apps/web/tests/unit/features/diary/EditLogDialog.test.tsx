import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { server } from "../../../support/msw/server";
import {
  EditLogDialog,
  type EditableLog,
  type EditableLogReview,
} from "@/features/diary/components/EditLogDialog";

const filmLog: EditableLog = {
  id: "entry-1",
  mediaType: "movie",
  tmdbId: 550,
  title: "Fight Club",
  watchedDate: "2026-01-15",
  rating: 8,
  rewatch: false,
  hasReview: true,
};

const renderDialog = (log: EditableLog, onClose: () => void, review?: EditableLogReview) => {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <EditLogDialog isOpen onClose={onClose} log={log} review={review} />
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
    renderDialog(filmLog, () => {
      closed = true;
    });

    expect(screen.getByRole("button", { name: "save" })).toBeDisabled();
    await user.click(screen.getByRole("checkbox", { name: /watched this before/i }));
    await user.click(screen.getByRole("button", { name: "save" }));

    await waitFor(() => expect(closed).toBe(true));
    expect(body).toEqual({ rewatch: true });
  });

  it("saves the log and the review written with it together", async () => {
    let logBody: unknown = null;
    let reviewBody: unknown = null;
    server.use(
      http.put("*/api/diary/entry-1", async ({ request }) => {
        logBody = await request.json();
        return HttpResponse.json({ id: "entry-1" });
      }),
      http.put("*/api/reviews/review-1", async ({ request }) => {
        reviewBody = await request.json();
        return HttpResponse.json({
          id: "review-1",
          content: "Better the second time",
          containsSpoilers: true,
          updatedAt: "2026-11-08T00:00:00.000Z",
        });
      }),
    );
    const user = userEvent.setup();
    let closed = false;
    renderDialog(
      filmLog,
      () => {
        closed = true;
      },
      { id: "review-1", content: "Good", containsSpoilers: false },
    );

    expect(screen.getByText("EDIT LOG & REVIEW")).toBeInTheDocument();
    await user.click(screen.getByRole("checkbox", { name: /watched this before/i }));
    const review = screen.getByRole("textbox", { name: "Review" });
    await user.clear(review);
    await user.type(review, "Better the second time");
    await user.click(screen.getByRole("checkbox", { name: "Contains spoilers" }));
    await user.click(screen.getByRole("button", { name: "save" }));

    await waitFor(() => expect(closed).toBe(true));
    expect(logBody).toEqual({ rewatch: true });
    expect(reviewBody).toEqual({ content: "Better the second time", containsSpoilers: true });
  });

  it("won't save an emptied review", async () => {
    const user = userEvent.setup();
    renderDialog(filmLog, () => {}, { id: "review-1", content: "Good", containsSpoilers: false });

    await user.clear(screen.getByRole("textbox", { name: "Review" }));
    expect(screen.getByRole("button", { name: "save" })).toBeDisabled();
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
    renderDialog({ ...filmLog, id: "entry-2", mediaType: "tv", title: "Dark" }, () => {
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
    renderDialog(filmLog, () => {});

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
    renderDialog({ ...filmLog, id: "entry-2", mediaType: "tv", title: "Dark" }, () => {});

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
    renderDialog(filmLog, () => {
      closed = true;
    });

    await user.click(screen.getByRole("button", { name: /delete log/i }));
    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(await screen.findByText("Diary entry not found")).toBeInTheDocument();
    expect(closed).toBe(false);
  });
});
