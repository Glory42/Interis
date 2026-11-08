import { describe, expect, it } from "bun:test";
import { countVisibleRows, takeVisibleRows } from "../../../src/modules/social/helpers/social-feed-grouping.helper";
import type { GroupedFeedEntry } from "../../../src/modules/social/types/social-feed.types";

const at = new Date("2026-11-08T12:00:00Z");
const actor = { id: "u1" };

const title = (overrides: Record<string, unknown>) =>
  ({
    kind: "title",
    id: "t",
    createdAt: at,
    actor,
    movie: { tmdbId: 1, mediaType: "movie" },
    seasonNumber: null,
    episodeNumber: null,
    liked: false,
    watchlisted: false,
    watched: false,
    rating: null,
    review: null,
    ...overrides,
  }) as unknown as GroupedFeedEntry;

const liked = (tmdbId: number) => title({ movie: { tmdbId, mediaType: "movie" }, liked: true });
const watchlisted = (tmdbId: number) => title({ movie: { tmdbId, mediaType: "movie" }, watchlisted: true });
const episode = (episodeNumber: number, overrides: Record<string, unknown> = {}) =>
  title({ movie: { tmdbId: 46648, mediaType: "tv" }, seasonNumber: 1, episodeNumber, liked: true, ...overrides });
const follow = (id: string) =>
  ({ kind: "activity", item: { id, kind: "followed_user", createdAt: at, actor } }) as unknown as GroupedFeedEntry;
const watched = (tmdbId: number) => title({ movie: { tmdbId, mediaType: "movie" }, watched: true });

describe("countVisibleRows", () => {
  it("counts a run of likes, of watchlist adds and of follows as one row each", () => {
    expect(countVisibleRows([liked(1), liked(2), watchlisted(3), watchlisted(4), follow("f1"), follow("f2")])).toBe(3);
  });

  it("counts one show's seasons and episodes as one row, apart from title likes", () => {
    expect(countVisibleRows([episode(1, { rating: 8 }), episode(2), episode(3), liked(9)])).toBe(2);
  });

  it("keeps an episode review and every watch as its own row", () => {
    const review = { id: "r1" };
    expect(countVisibleRows([episode(1), episode(2, { review }), watched(1), watched(2)])).toBe(4);
  });

  it("starts a new run when the person or the show changes", () => {
    const otherActor = title({ movie: { tmdbId: 2, mediaType: "movie" }, liked: true, actor: { id: "u2" } });
    const otherShow = title({ movie: { tmdbId: 7, mediaType: "tv" }, seasonNumber: 1, episodeNumber: 1, liked: true });
    expect(countVisibleRows([liked(1), otherActor, episode(1), otherShow])).toBe(4);
  });
});

describe("takeVisibleRows", () => {
  it("keeps whole runs up to the limit", () => {
    const entries = [watchlisted(1), watchlisted(2), watchlisted(3), watched(4), watched(5)];
    expect(takeVisibleRows(entries, 2)).toHaveLength(4);
  });
});
