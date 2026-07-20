import { describe, expect, it } from "bun:test";
import { PasswordService } from "../../../src/modules/auth/services/password.service";

describe("PasswordService (unit)", () => {
  it("hashes a password and verifies the original plaintext against it", async () => {
    const hash = await PasswordService.hash("correct horse battery staple");

    expect(hash).not.toBe("correct horse battery staple");
    const result = await PasswordService.verify("correct horse battery staple", hash);
    expect(result.matches).toBe(true);
    expect(result.upgradedHash).toBeNull();
  });

  it("rejects an incorrect plaintext against an existing hash", async () => {
    const hash = await PasswordService.hash("correct horse battery staple");

    const result = await PasswordService.verify("wrong password", hash);
    expect(result.matches).toBe(false);
    expect(result.upgradedHash).toBeNull();
  });

  it("verifies a legacy Bun.password argon2id hash and returns an upgraded hash", async () => {
    const legacyHash = await Bun.password.hash("correct horse battery staple", {
      algorithm: "argon2id",
    });

    const result = await PasswordService.verify("correct horse battery staple", legacyHash);
    expect(result.matches).toBe(true);
    expect(result.upgradedHash).not.toBeNull();

    const reverified = await PasswordService.verify(
      "correct horse battery staple",
      result.upgradedHash as string,
    );
    expect(reverified.matches).toBe(true);
    expect(reverified.upgradedHash).toBeNull();
  });

  it("rejects an incorrect plaintext against a legacy argon2id hash", async () => {
    const legacyHash = await Bun.password.hash("correct horse battery staple", {
      algorithm: "argon2id",
    });

    const result = await PasswordService.verify("wrong password", legacyHash);
    expect(result.matches).toBe(false);
    expect(result.upgradedHash).toBeNull();
  });
});
