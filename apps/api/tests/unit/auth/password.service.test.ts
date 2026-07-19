import { describe, expect, it } from "bun:test";
import { PasswordService } from "../../../src/modules/auth/services/password.service";

describe("PasswordService (unit)", () => {
  it("hashes a password and verifies the original plaintext against it", async () => {
    const hash = await PasswordService.hash("correct horse battery staple");

    expect(hash).not.toBe("correct horse battery staple");
    expect(await PasswordService.verify("correct horse battery staple", hash)).toBe(true);
  });

  it("rejects an incorrect plaintext against an existing hash", async () => {
    const hash = await PasswordService.hash("correct horse battery staple");

    expect(await PasswordService.verify("wrong password", hash)).toBe(false);
  });
});
