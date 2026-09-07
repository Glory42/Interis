import { describe, expect, it } from "vitest";
import {
  normalizeUsername,
  validateUsernameInput,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
} from "@/features/auth/username";

describe("normalizeUsername", () => {
  it("trims surrounding whitespace and lowercases", () => {
    expect(normalizeUsername("  MixedCase  ")).toBe("mixedcase");
  });
});

describe("validateUsernameInput", () => {
  it("accepts a valid username", () => {
    expect(validateUsernameInput("valid_user_1")).toBeNull();
  });

  it("normalizes before validating (trailing spaces / caps are fine)", () => {
    expect(validateUsernameInput("  ValidUser  ")).toBeNull();
  });

  it("rejects a username below the minimum length", () => {
    expect(validateUsernameInput("ab")).toBe(
      `Username must be ${USERNAME_MIN_LENGTH}-${USERNAME_MAX_LENGTH} characters.`,
    );
  });

  it("rejects a username above the maximum length", () => {
    expect(validateUsernameInput("a".repeat(USERNAME_MAX_LENGTH + 1))).toBe(
      `Username must be ${USERNAME_MIN_LENGTH}-${USERNAME_MAX_LENGTH} characters.`,
    );
  });

  it("accepts a username exactly at the boundary lengths", () => {
    expect(validateUsernameInput("a".repeat(USERNAME_MIN_LENGTH))).toBeNull();
    expect(validateUsernameInput("a".repeat(USERNAME_MAX_LENGTH))).toBeNull();
  });

  it("rejects disallowed characters", () => {
    expect(validateUsernameInput("has-a-dash")).toBe(
      "Username can only contain lowercase letters, numbers, and underscores.",
    );
    expect(validateUsernameInput("has spaces")).toMatch(/can only contain/);
    expect(validateUsernameInput("dotted.name")).toMatch(/can only contain/);
  });

  it("rejects a reserved username", () => {
    expect(validateUsernameInput("admin")).toBe(
      "This username is reserved. Choose another one.",
    );
  });

  it("rejects a reserved username case-insensitively", () => {
    expect(validateUsernameInput("  SETTINGS ")).toMatch(/reserved/);
  });
});
