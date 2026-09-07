import { describe, expect, it } from "vitest";
import type { PublicProfile } from "@/types/api";
import {
  formatJoinedDate,
  getProfileDisplayName,
  getRelativeTime,
} from "@/features/profile/utils/profile.utils";

const profile = (over: Partial<PublicProfile>): PublicProfile =>
  ({
    username: "fallback_username",
    displayUsername: null,
    name: null,
    ...over,
  }) as PublicProfile;

describe("getProfileDisplayName", () => {
  it("prefers displayUsername", () => {
    expect(
      getProfileDisplayName(profile({ displayUsername: "Display", name: "Name" })),
    ).toBe("Display");
  });

  it("falls back to name when displayUsername is absent", () => {
    expect(getProfileDisplayName(profile({ displayUsername: null, name: "Name" }))).toBe("Name");
  });

  it("falls back to username when both are absent", () => {
    expect(getProfileDisplayName(profile({}))).toBe("fallback_username");
  });
});

describe("formatJoinedDate", () => {
  it("returns 'Unknown' for a null/undefined value", () => {
    expect(formatJoinedDate(null)).toBe("Unknown");
    expect(formatJoinedDate(undefined)).toBe("Unknown");
  });

  it("returns the raw value when it is not a parseable date", () => {
    expect(formatJoinedDate("not-a-date")).toBe("not-a-date");
  });

  it("formats as short month + year by default", () => {
    expect(formatJoinedDate("2026-03-15T00:00:00.000Z")).toBe("Mar 2026");
  });

  it("formats as long month + year when asked", () => {
    expect(formatJoinedDate("2026-03-15T00:00:00.000Z", "long")).toBe("March 2026");
  });
});

describe("getRelativeTime", () => {
  it("returns a placeholder for a null/undefined value", () => {
    expect(getRelativeTime(null)).toBe("No activity yet");
    expect(getRelativeTime(undefined)).toBe("No activity yet");
  });

  it("produces a relative phrase for a real timestamp", () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    expect(getRelativeTime(twoHoursAgo)).toBe("2 hours ago");
  });
});
