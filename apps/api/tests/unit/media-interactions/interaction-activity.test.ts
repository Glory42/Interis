import { describe, expect, it } from "bun:test";
import { diffInteractionActivity } from "../../../src/modules/media-interactions/helpers/interaction-activity.helper";
import { isSeriesWatched } from "../../../src/modules/media-interactions/helpers/interaction-state-rules.helper";

const unset = { liked: false, watchlisted: false };
const liked = { liked: true, watchlisted: false };
const watchlisted = { liked: false, watchlisted: true };

describe("diffInteractionActivity", () => {
  it.each([
    ["an explicit true on an unset flag records it", { liked: true }, null, liked, ["liked"], []],
    ["re-sending true records nothing (#79)", { liked: true }, liked, liked, [], []],
    ["a true the write didn't keep records nothing", { watchlisted: true }, null, unset, [], []],
    ["an explicit false on a set flag retracts it", { liked: false }, liked, unset, [], ["liked"]],
    ["a false on an unset flag retracts nothing", { watchlisted: false }, null, unset, [], []],
    ["an implied clear retracts nothing", { liked: true }, watchlisted, liked, ["liked"], []],
    ["no flag sent, no Activity", {}, liked, unset, [], []],
  ] as const)("%s", (_name, change, previous, current, record, retract) => {
    expect(diffInteractionActivity(change, previous, current)).toEqual({
      record: [...record],
      retract: [...retract],
    });
  });
});

describe("isSeriesWatched", () => {
  it("is true only for a completed watch status", () => {
    expect(isSeriesWatched("completed")).toBe(true);
    expect(isSeriesWatched("watching")).toBe(false);
    expect(isSeriesWatched(null)).toBe(false);
    expect(isSeriesWatched(undefined)).toBe(false);
  });
});
