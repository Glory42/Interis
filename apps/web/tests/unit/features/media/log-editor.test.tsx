import { beforeEach, describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { server } from "../../../support/msw/server";
import { LogEditor } from "@/features/media/log-editor/LogEditor";
import type { ExistingLogSubject, NewLogSubject } from "@/features/media/log-editor/log-subject";
import { refreshAfter } from "@/features/media/media-refresh";
import { todayAsLocalDateInput } from "@/lib/time";
import { createDiaryEntryInputSchema } from "@/types/api";

vi.mock("@/features/media/media-refresh", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/media/media-refresh")>()),
  refreshAfter: vi.fn(() => Promise.resolve()),
}));

type SentRequest = { method: string; path: string; body: unknown };

const film = { kind: "film" as const, tmdbId: 550, title: "Fight Club", year: 1999, posterPath: null };
const series = { kind: "tv" as const, tmdbId: 1399, title: "Game of Thrones", year: 2011, posterPath: null };

const newFilmLog: NewLogSubject = { ...film, type: "new", rating: 8, rewatch: false };
const newSeriesLog: NewLogSubject = { ...series, type: "new", rating: null, rewatch: false };
const filmLog: ExistingLogSubject = {
  ...film,
  type: "existing",
  logId: "entry-1",
  watchedDate: "2026-01-15",
  rating: 8,
  rewatch: false,
  review: { id: "review-1", content: "Good", containsSpoilers: false },
};
const seriesLog: ExistingLogSubject = {
  ...series,
  type: "existing",
  logId: "log-1",
  watchedDate: "2026-02-01",
  rating: null,
  rewatch: true,
  review: { id: "review-2", content: "Winter came", containsSpoilers: false },
};

const createdFilmLog = {
  entry: {
    id: "entry-9",
    userId: "user-1",
    movieId: 1,
    watchedDate: "2026-01-15",
    rating: 8,
    rewatch: false,
    createdAt: "2026-01-15T00:00:00.000Z",
    updatedAt: "2026-01-15T00:00:00.000Z",
  },
  movie: {
    id: 1,
    tmdbId: 550,
    title: "Fight Club",
    originalTitle: "Fight Club",
    posterPath: null,
    backdropPath: null,
    releaseDate: "1999-10-15",
    releaseYear: 1999,
    director: null,
    runtime: 139,
    overview: null,
    tagline: null,
    genres: [],
    cachedAt: "2026-01-01T00:00:00.000Z",
  },
  review: null,
};

// Records every log request the editor sends, with its body.
const recordRequests = (): SentRequest[] => {
  const sent: SentRequest[] = [];
  const record = (response: () => Response) => async ({ request }: { request: Request }) => {
    const url = new URL(request.url);
    const text = await request.text();
    sent.push({ method: request.method, path: url.pathname + url.search, body: text ? JSON.parse(text) : null });
    return response();
  };
  server.use(
    http.get("*/api/interactions/:tmdbId", () =>
      HttpResponse.json({ liked: false, watchlisted: false, rating: null, watched: false }),
    ),
    http.post("*/api/diary", record(() => HttpResponse.json(createdFilmLog))),
    http.put("*/api/diary/:id", record(() => HttpResponse.json({ id: "entry-1", review: null }))),
    http.put("*/api/serials/logs/:id", record(() => HttpResponse.json({ id: "log-1", review: null }))),
    http.delete("*/api/serials/logs/:id", record(() => HttpResponse.json({ success: true }))),
    http.put("*/api/serials/:tmdbId/interaction", record(() =>
      HttpResponse.json({ liked: true, watchlisted: false, rating: null, watched: true }),
    )),
  );
  return sent;
};

const renderEditor = (subject: NewLogSubject | ExistingLogSubject) => {
  const onClose = vi.fn();
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <LogEditor isOpen subject={subject} onClose={onClose} />
    </QueryClientProvider>,
  );
  return { onClose, user: userEvent.setup() };
};

const events = () => vi.mocked(refreshAfter).mock.calls.map(([, event]) => event);

describe("LogEditor", () => {
  beforeEach(() => vi.mocked(refreshAfter).mockClear());

  it("logs a new Film with the review it picked up from the draft", async () => {
    window.localStorage.setItem("interis:review-draft:movie:550", "Half a");
    const sent = recordRequests();
    const { onClose, user } = renderEditor(newFilmLog);

    const review = screen.getByRole("textbox", { name: "Review" });
    expect(review).toHaveValue("Half a");
    await user.type(review, " thought  ");
    await user.click(screen.getByRole("button", { name: "Post review" }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(sent).toEqual([
      {
        method: "POST",
        path: "/api/diary",
        body: {
          tmdbId: 550,
          watchedDate: todayAsLocalDateInput(),
          rating: 8,
          rewatch: false,
          review: "Half a thought",
          containsSpoilers: false,
        },
      },
    ]);
    expect(events()).toEqual([{ type: "log-created", kind: "film", tmdbId: 550, hasReview: true }]);
    expect(window.localStorage.getItem("interis:review-draft:movie:550")).toBeNull();
  });

  it("logs a new Series and saves the Like only when it was toggled", async () => {
    const sent = recordRequests();
    server.use(
      http.post("*/api/serials/:tmdbId/log", async ({ request }) => {
        sent.push({ method: "POST", path: "/api/serials/1399/log", body: await request.json() });
        return HttpResponse.json({
          entry: { id: "log-9", userId: "user-1", seriesId: 1, watchedDate: "2026-01-01", rating: null, rewatch: false, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
          series: { id: 1, tmdbId: 1399, title: "Game of Thrones", posterPath: null, firstAirYear: 2011 },
          review: null,
        });
      }),
    );
    const { onClose, user } = renderEditor(newSeriesLog);

    await user.click(screen.getByRole("button", { name: "Like" }));
    await user.click(screen.getByRole("button", { name: "Save log" }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(sent).toEqual(
      expect.arrayContaining([
        { method: "POST", path: "/api/serials/1399/log", body: { watchedDate: todayAsLocalDateInput(), rewatch: false } },
        { method: "PUT", path: "/api/serials/1399/interaction", body: { liked: true } },
      ]),
    );
    expect(sent).toHaveLength(2);
    expect(events()).toContainEqual({ type: "log-created", kind: "tv", tmdbId: 1399, hasReview: false });
  });

  it("edits a log and its Review in one request", async () => {
    const sent = recordRequests();
    const { onClose, user } = renderEditor(filmLog);

    const save = screen.getByRole("button", { name: "Save" });
    expect(save).toBeDisabled();
    await user.click(screen.getByRole("button", { name: /First watch/ }));
    const review = screen.getByRole("textbox", { name: "Review" });
    await user.clear(review);
    await user.type(review, "Better the second time");
    await user.click(screen.getByRole("switch", { name: "Contains spoilers" }));
    await user.click(save);

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(sent).toEqual([
      {
        method: "PUT",
        path: "/api/diary/entry-1",
        body: { rewatch: true, review: "Better the second time", containsSpoilers: true },
      },
    ]);
    expect(events()).toEqual([{ type: "log-edited", kind: "film", tmdbId: 550 }]);
  });

  it("removes the attached Review when its text is emptied", async () => {
    const sent = recordRequests();
    const { onClose, user } = renderEditor(seriesLog);

    await user.clear(screen.getByRole("textbox", { name: "Review" }));
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(sent).toEqual([{ method: "PUT", path: "/api/serials/logs/log-1", body: { review: null } }]);
    expect(events()).toEqual([{ type: "log-edited", kind: "tv", tmdbId: 1399 }]);
  });

  it("shows the API's message and stays open when a save fails", async () => {
    recordRequests();
    server.use(
      http.put("*/api/diary/:id", () =>
        HttpResponse.json({ error: { message: "Watched date can't be in the future." } }, { status: 400 }),
      ),
    );
    const { onClose, user } = renderEditor(filmLog);

    await user.click(screen.getByRole("button", { name: /First watch/ }));
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Watched date can't be in the future.");
    expect(onClose).not.toHaveBeenCalled();
    expect(events()).toEqual([]);
  });

  it("deletes the log after asking, unwatching if picked", async () => {
    const sent = recordRequests();
    const { onClose, user } = renderEditor(seriesLog);

    await user.click(screen.getByRole("button", { name: "Delete log" }));
    expect(screen.getByText("The review you wrote with it stays on your profile.")).toBeInTheDocument();
    await user.click(screen.getByRole("checkbox", { name: /Also unmark the series/ }));
    await user.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(sent).toEqual([{ method: "DELETE", path: "/api/serials/logs/log-1?unwatch=true", body: null }]);
    expect(events()).toEqual([{ type: "log-deleted", kind: "tv", tmdbId: 1399, unwatch: true }]);
  });

  it.each([
    ["a new log", newFilmLog],
    ["an edited log", filmLog],
  ])("gives %s's review the one Review limit", (_name, subject) => {
    recordRequests();
    renderEditor(subject);
    expect(screen.getByRole("textbox", { name: "Review" })).toHaveAttribute("maxLength", "10000");
  });

  it("accepts a full-length Review when creating a log", () => {
    const input = { tmdbId: 550, watchedDate: "2026-01-15" };
    expect(createDiaryEntryInputSchema.safeParse({ ...input, review: "a".repeat(10_000) }).success).toBe(true);
    expect(createDiaryEntryInputSchema.safeParse({ ...input, review: "a".repeat(10_001) }).success).toBe(false);
  });
});
