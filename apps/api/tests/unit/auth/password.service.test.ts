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

  it("verifies a legacy pbkdf2-sha256 hash (from the Workers deployment) and upgrades it", async () => {
    // A real hash produced by the Hono/Workers-era PasswordService for this
    // exact plaintext - fixture, not derived from any live account.
    const legacyHash =
      "$pbkdf2-sha256$i=100000$vu176dg8k26gcCFUJWGuuA$i/H4D8z2AkcR5FKdyDT+B6m1yQVuZ0odTL+3KerzZq4";

    const result = await PasswordService.verify("WasmArgonTest1!", legacyHash);
    expect(result.matches).toBe(true);
    expect(result.upgradedHash).not.toBeNull();

    const reverified = await PasswordService.verify(
      "WasmArgonTest1!",
      result.upgradedHash as string,
    );
    expect(reverified.matches).toBe(true);
    expect(reverified.upgradedHash).toBeNull();
  });

  it("rejects an incorrect plaintext against a legacy pbkdf2-sha256 hash", async () => {
    const legacyHash =
      "$pbkdf2-sha256$i=100000$vu176dg8k26gcCFUJWGuuA$i/H4D8z2AkcR5FKdyDT+B6m1yQVuZ0odTL+3KerzZq4";

    const result = await PasswordService.verify("wrong password", legacyHash);
    expect(result.matches).toBe(false);
    expect(result.upgradedHash).toBeNull();
  });
});
