import { describe, expect, it } from "bun:test";
import { cutGroupedPage } from "../../../src/modules/social/helpers/social-feed-grouped-page.helper";
import type { ActivityRow, GroupedFeedEntry } from "../../../src/modules/social/types/social-feed.types";

const row = (id: string, at: string) =>
  ({ activity: { id, createdAt: new Date(at) }, actorId: "u1", actorUsername: "u1" }) as unknown as ActivityRow;

const title = (id: string, at: string, action: "like" | "watch") =>
  ({
    kind: "title",
    id,
    createdAt: new Date(at),
    actor: { id: "u1" },
    liked: true,
    watched: action === "watch",
    rating: null,
    review: null,
    watchlisted: false,
  }) as unknown as GroupedFeedEntry;

const likes = (day: string, count: number) =>
  Array.from({ length: count }, (_, index) => {
    const at = `${day}T12:${String(59 - index).padStart(2, "0")}:00Z`;
    return { row: row(`${day}-like-${index}`, at), entry: title(`${day}-like-${index}`, at, "like") };
  });

describe("cutGroupedPage", () => {
  it("counts a run of likes as one row, so older days still fit", () => {
    const burst = likes("2026-11-08", 20);
    const older = { row: row("old", "2026-11-07T09:00:00Z"), entry: title("old", "2026-11-07T09:00:00Z", "watch") };
    const cut = cutGroupedPage(
      [...burst.map((like) => like.row), older.row],
      [...burst.map((like) => like.entry), older.entry],
      2,
      null,
    );

    expect(cut.items).toHaveLength(21);
    expect(cut.lastRow?.activity.id).toBe("old");
    expect(cut.coversAllRows).toBe(true);
  });

  it("stops at the first whole day that reaches the limit", () => {
    const today = [row("a", "2026-11-08T10:00:00Z"), row("b", "2026-11-08T09:00:00Z")];
    const yesterday = row("c", "2026-11-07T10:00:00Z");
    const cut = cutGroupedPage(
      [...today, yesterday],
      [title("a", "2026-11-08T10:00:00Z", "watch"), title("b", "2026-11-08T09:00:00Z", "watch"), title("c", "2026-11-07T10:00:00Z", "watch")],
      2,
      null,
    );

    expect(cut.items.map((entry) => (entry.kind === "title" ? entry.id : ""))).toEqual(["a", "b"]);
    expect(cut.lastRow?.activity.id).toBe("b");
    expect(cut.coversAllRows).toBe(false);
  });

  it("leaves a day that continues past the rows read for the next page", () => {
    const cut = cutGroupedPage(
      [row("a", "2026-11-08T10:00:00Z"), row("b", "2026-11-07T10:00:00Z")],
      [title("a", "2026-11-08T10:00:00Z", "watch"), title("b", "2026-11-07T10:00:00Z", "watch")],
      15,
      "2026-11-07",
    );

    expect(cut.items).toHaveLength(1);
    expect(cut.lastRow?.activity.id).toBe("a");
  });

  it("ends mid-day when one day is more than the rows read", () => {
    const burst = likes("2026-11-08", 5);
    const cut = cutGroupedPage(
      burst.map((like) => like.row),
      burst.map((like) => like.entry),
      15,
      "2026-11-08",
    );

    expect(cut.items).toHaveLength(5);
    expect(cut.lastRow?.activity.id).toBe("2026-11-08-like-4");
  });
});
