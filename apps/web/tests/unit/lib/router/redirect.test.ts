import { describe, expect, it } from "vitest";
import {
  getSafeRedirectPath,
  normalizeInternalRedirectPath,
} from "@/lib/router/redirect";

describe("router redirect helpers", () => {
  it("keeps valid internal redirects", () => {
    expect(normalizeInternalRedirectPath("/settings/profile?tab=auth#pwd")).toBe(
      "/settings/profile?tab=auth#pwd",
    );
  });

  it("rejects protocol-relative redirects", () => {
    expect(normalizeInternalRedirectPath("//evil.site/login")).toBeNull();
  });

  it("rejects absolute external redirects", () => {
    expect(normalizeInternalRedirectPath("https://evil.site/login")).toBeNull();
  });

  it("falls back when redirect is invalid", () => {
    expect(getSafeRedirectPath("https://evil.site", "/cinema")).toBe("/cinema");
  });
});
