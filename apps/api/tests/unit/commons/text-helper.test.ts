import { describe, expect, it } from "bun:test";
import { truncateExcerpt } from "../../../src/commons/helpers/text.helper";
import { ACTIVITY_EXCERPT_LENGTH } from "../../../src/commons/constants/activity.constants";

describe("truncateExcerpt", () => {
  it("leaves content shorter than the limit untouched", () => {
    expect(truncateExcerpt("short review")).toBe("short review");
  });

  it("truncates to ACTIVITY_EXCERPT_LENGTH by default", () => {
    const long = "x".repeat(ACTIVITY_EXCERPT_LENGTH + 50);
    expect(truncateExcerpt(long)).toHaveLength(ACTIVITY_EXCERPT_LENGTH);
  });

  it("keeps content exactly at the limit", () => {
    const exact = "y".repeat(ACTIVITY_EXCERPT_LENGTH);
    expect(truncateExcerpt(exact)).toBe(exact);
  });

  it("honours an explicit length override", () => {
    expect(truncateExcerpt("abcdefghij", 4)).toBe("abcd");
  });

  it("returns an empty string unchanged", () => {
    expect(truncateExcerpt("")).toBe("");
  });
});
