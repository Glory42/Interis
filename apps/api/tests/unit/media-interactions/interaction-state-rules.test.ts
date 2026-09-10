import { describe, expect, it } from "bun:test";
import {
  deriveImplicitWatched,
  resolveInteractionUpdate,
} from "../../../src/modules/media-interactions/helpers/interaction-state-rules.helper";

describe("deriveImplicitWatched", () => {
  it("is true when liked is true", () => {
    expect(deriveImplicitWatched({ liked: true })).toBe(true);
  });

  it("is true when a numeric rating is present", () => {
    expect(deriveImplicitWatched({ rating: 7 })).toBe(true);
    expect(deriveImplicitWatched({ rating: 0 })).toBe(true);
  });

  it("is false for rating: null and for the empty input", () => {
    expect(deriveImplicitWatched({ rating: null })).toBe(false);
    expect(deriveImplicitWatched({})).toBe(false);
  });

  it("is false when only unliking", () => {
    expect(deriveImplicitWatched({ liked: false })).toBe(false);
  });

  it("matches the signal resolveInteractionUpdate applies internally", () => {
    expect(resolveInteractionUpdate({ liked: true }).updateSet.isWatched).toBe(true);
    expect(deriveImplicitWatched({ liked: true })).toBe(true);
  });
});

describe("resolveInteractionUpdate", () => {
  describe("watchlist auto-clear", () => {
    it("clears watchlisted on the update set when liked becomes true", () => {
      const { updateSet } = resolveInteractionUpdate({ liked: true });
      expect(updateSet.watchlisted).toBe(false);
    });

    it("clears watchlisted on the update set when watched is set explicitly", () => {
      const { updateSet } = resolveInteractionUpdate({ watched: true });
      expect(updateSet.watchlisted).toBe(false);
    });

    it("clears watchlisted on the update set when a rating is set (implicit watch)", () => {
      const { updateSet } = resolveInteractionUpdate({ rating: 8 });
      expect(updateSet.watchlisted).toBe(false);
      expect(updateSet.isWatched).toBe(true);
    });

    it("does not touch watchlisted when unliking", () => {
      const { updateSet } = resolveInteractionUpdate({ liked: false });
      expect(updateSet.watchlisted).toBeUndefined();
    });

    it("does not touch watchlisted when explicitly un-marking watched", () => {
      const { updateSet } = resolveInteractionUpdate({ watched: false });
      expect(updateSet.watchlisted).toBeUndefined();
    });

    it("lets an explicit watchlisted value in the same request win over the auto-clear", () => {
      const { updateSet } = resolveInteractionUpdate({ liked: true, watchlisted: true });
      expect(updateSet.watchlisted).toBe(true);
    });

    it("leaves watchlisted alone on a plain watchlist toggle", () => {
      const { updateSet } = resolveInteractionUpdate({ watchlisted: true });
      expect(updateSet.watchlisted).toBe(true);
      expect(updateSet.isWatched).toBeUndefined();
    });
  });

  describe("insert-vs-conflict isWatched precedence", () => {
    it("insert: explicit watched wins over the implicit-watch signal", () => {
      const { insertValues } = resolveInteractionUpdate({ liked: true, watched: false });
      expect(insertValues.isWatched).toBe(false);
    });

    it("insert: falls back to the implicit-watch signal when watched is unset", () => {
      const { insertValues } = resolveInteractionUpdate({ rating: 5 });
      expect(insertValues.isWatched).toBe(true);
    });

    it("update: the implicit-watch signal wins over an explicit watched value", () => {
      const { updateSet } = resolveInteractionUpdate({ liked: true, watched: false });
      expect(updateSet.isWatched).toBe(true);
    });
  });

  it("treats rating: null as not implicitly watched", () => {
    const { insertValues, updateSet } = resolveInteractionUpdate({ rating: null });
    expect(insertValues.isWatched).toBe(false);
    expect(updateSet.isWatched).toBeUndefined();
    expect(updateSet.watchlisted).toBeUndefined();
  });
});
