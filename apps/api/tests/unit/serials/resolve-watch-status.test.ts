import { describe, expect, it } from "bun:test";
import { resolveWatchStatusFromProgress } from "../../../src/modules/serials/helpers/serials-watch-status.helper";

const resolve = (overrides: Partial<Parameters<typeof resolveWatchStatusFromProgress>[0]>) =>
  resolveWatchStatusFromProgress({
    current: null,
    watchedEpisodesCount: 0,
    totalEpisodes: 10,
    episodeAdded: true,
    ...overrides,
  });

describe("resolveWatchStatusFromProgress", () => {
  it("clears the status once no regular episode is watched", () => {
    expect(resolve({ current: "watching", watchedEpisodesCount: 0, episodeAdded: false })).toBeNull();
    expect(resolve({ current: "dropped", watchedEpisodesCount: 0, episodeAdded: false })).toBeNull();
  });

  it("is watching while partway through", () => {
    expect(resolve({ watchedEpisodesCount: 1 })).toBe("watching");
  });

  it("is completed once every episode is watched, even from dropped", () => {
    expect(resolve({ watchedEpisodesCount: 10 })).toBe("completed");
    expect(resolve({ current: "dropped", watchedEpisodesCount: 10 })).toBe("completed");
  });

  it("goes back to watching when a completed series loses an episode", () => {
    expect(resolve({ current: "completed", watchedEpisodesCount: 9, episodeAdded: false })).toBe(
      "watching",
    );
  });

  it("keeps paused / dropped when an episode is unchecked", () => {
    expect(resolve({ current: "paused", watchedEpisodesCount: 3, episodeAdded: false })).toBe("paused");
    expect(resolve({ current: "dropped", watchedEpisodesCount: 3, episodeAdded: false })).toBe("dropped");
  });

  it("resumes a paused / dropped series when a new episode is checked", () => {
    expect(resolve({ current: "paused", watchedEpisodesCount: 4 })).toBe("watching");
    expect(resolve({ current: "dropped", watchedEpisodesCount: 4 })).toBe("watching");
  });

  it("can't call a series completed without a known episode total", () => {
    expect(resolve({ watchedEpisodesCount: 5, totalEpisodes: null })).toBe("watching");
    expect(resolve({ watchedEpisodesCount: 5, totalEpisodes: 0 })).toBe("watching");
  });
});
