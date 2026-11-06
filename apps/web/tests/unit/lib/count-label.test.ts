import { describe, expect, it } from "vitest";
import { formatCountLabel } from "@/lib/count-label";

describe("formatCountLabel", () => {
  it("uses the singular for exactly one", () => {
    expect(formatCountLabel(1, "log")).toBe("1 log");
  });

  it("pluralises and groups other counts", () => {
    expect(formatCountLabel(0, "log")).toBe("0 logs");
    expect(formatCountLabel(1200, "log")).toBe("1,200 logs");
  });
});
