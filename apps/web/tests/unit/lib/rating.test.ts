import { describe, expect, it } from "vitest";
import { formatRatingLabel } from "@/lib/rating";

describe("formatRatingLabel", () => {
  it("returns null for null or NaN", () => {
    expect(formatRatingLabel(null)).toBeNull();
    expect(formatRatingLabel(Number.NaN)).toBeNull();
  });

  it("formats an integer rating with the /10 suffix", () => {
    expect(formatRatingLabel(8)).toBe("8/10");
  });

  it("keeps one decimal place and drops a trailing .0", () => {
    expect(formatRatingLabel(7.25)).toBe("7.3/10");
    expect(formatRatingLabel(7.04)).toBe("7/10");
  });

  it("omits the suffix when asked", () => {
    expect(formatRatingLabel(8, { withSuffix: false })).toBe("8");
    expect(formatRatingLabel(7.25, { withSuffix: false })).toBe("7.3");
  });

  it("clamps out-of-range values into 0–10", () => {
    expect(formatRatingLabel(-3)).toBe("0/10");
    expect(formatRatingLabel(42)).toBe("10/10");
  });
});
