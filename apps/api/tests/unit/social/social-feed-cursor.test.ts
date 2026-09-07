import { describe, expect, it } from "bun:test";
import {
  decodeFeedCursor,
  encodeFeedCursor,
} from "../../../src/modules/social/helpers/social-feed-cursor.helper";

describe("feed cursor encode/decode", () => {
  it("round-trips a cursor", () => {
    const createdAt = new Date("2026-01-02T03:04:05.678Z");
    const encoded = encodeFeedCursor({ createdAt, id: "abc-123" });
    const decoded = decodeFeedCursor(encoded);

    expect(decoded?.id).toBe("abc-123");
    expect(decoded?.createdAt.toISOString()).toBe(createdAt.toISOString());
  });

  it("produces a URL-safe token (base64url, no padding chars)", () => {
    const encoded = encodeFeedCursor({
      createdAt: new Date("2026-01-02T03:04:05.678Z"),
      id: "abc-123",
    });
    expect(encoded).not.toMatch(/[+/=]/);
  });

  it("round-trips an id that itself contains a separator character", () => {
    const createdAt = new Date("2026-01-02T03:04:05.678Z");
    const decoded = decodeFeedCursor(encodeFeedCursor({ createdAt, id: "a|b|c" }));
    expect(decoded?.id).toBe("a|b|c");
  });

  it("returns undefined for an undefined input", () => {
    expect(decodeFeedCursor(undefined)).toBeUndefined();
  });

  it("returns undefined for a token with no separator", () => {
    const raw = Buffer.from("no-separator-here", "utf8").toString("base64url");
    expect(decodeFeedCursor(raw)).toBeUndefined();
  });

  it("returns undefined when the id half is empty", () => {
    const raw = Buffer.from("2026-01-02T03:04:05.678Z|", "utf8").toString("base64url");
    expect(decodeFeedCursor(raw)).toBeUndefined();
  });

  it("returns undefined when the date half is not a valid date", () => {
    const raw = Buffer.from("not-a-date|abc-123", "utf8").toString("base64url");
    expect(decodeFeedCursor(raw)).toBeUndefined();
  });

  it("returns undefined for a garbage token instead of throwing", () => {
    expect(decodeFeedCursor("!!!not-base64!!!")).toBeUndefined();
  });
});
