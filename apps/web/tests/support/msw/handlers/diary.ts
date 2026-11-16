import { http, HttpResponse } from "msw";

// A log's owner-only note and tags, and a user's tag counts; tests override these as needed.
export const diaryHandlers = [
  http.get("*/api/diary/:id", () => HttpResponse.json({ id: "entry", note: null, tags: [] })),
  http.get("*/api/serials/logs/:id", () => HttpResponse.json({ id: "log", note: null, tags: [] })),
  http.get("*/api/users/:username/diary/tags", () => HttpResponse.json([])),
];
