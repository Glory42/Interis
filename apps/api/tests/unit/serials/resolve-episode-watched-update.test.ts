import { describe, expect, it } from "bun:test";
import { resolveEpisodeWatchedUpdate } from "../../../src/modules/serials/helpers/serials-implicit-watched.helper";

const row = (overrides: Partial<Parameters<typeof resolveEpisodeWatchedUpdate>[0] & object> = {}) => ({
  watched: false,
  watchedImplicitly: false,
  liked: false,
  rating: null as number | null,
  ...overrides,
});

describe("resolveEpisodeWatchedUpdate", () => {
  it("an explicit watched always wins and is never implicit", () => {
    expect(resolveEpisodeWatchedUpdate(null, { watched: true, liked: true })).toEqual({
      watched: true,
      watchedImplicitly: false,
    });
    expect(
      resolveEpisodeWatchedUpdate(row({ watched: true, watchedImplicitly: true, liked: true }), {
        watched: false,
      }),
    ).toEqual({ watched: false, watchedImplicitly: false });
  });

  it("liking or rating an unwatched episode marks it watched implicitly", () => {
    expect(resolveEpisodeWatchedUpdate(null, { liked: true })).toEqual({
      watched: true,
      watchedImplicitly: true,
    });
    expect(resolveEpisodeWatchedUpdate(row(), { rating: 7 })).toEqual({
      watched: true,
      watchedImplicitly: true,
    });
  });

  it("leaves watched alone for writes that aren't a like or rating", () => {
    expect(resolveEpisodeWatchedUpdate(row(), { liked: false })).toBeUndefined();
    expect(resolveEpisodeWatchedUpdate(row(), { rating: null })).toBeUndefined();
  });

  it("doesn't turn an explicit watch into an implicit one", () => {
    expect(resolveEpisodeWatchedUpdate(row({ watched: true }), { liked: true })).toBeUndefined();
    expect(
      resolveEpisodeWatchedUpdate(row({ watched: true, liked: true }), { liked: false }),
    ).toBeUndefined();
  });

  it("takes an implicit watch back once no like or rating is left", () => {
    const implicit = row({ watched: true, watchedImplicitly: true, liked: true });
    expect(resolveEpisodeWatchedUpdate(implicit, { liked: false })).toEqual({
      watched: false,
      watchedImplicitly: false,
    });
  });

  it("keeps an implicit watch while a rating or like remains", () => {
    const likedAndRated = row({ watched: true, watchedImplicitly: true, liked: true, rating: 8 });
    expect(resolveEpisodeWatchedUpdate(likedAndRated, { liked: false })).toBeUndefined();
    expect(resolveEpisodeWatchedUpdate(likedAndRated, { rating: null })).toBeUndefined();
    expect(
      resolveEpisodeWatchedUpdate(likedAndRated, { liked: false, rating: null }),
    ).toEqual({ watched: false, watchedImplicitly: false });
  });
});
