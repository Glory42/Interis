import { describe, expect, it } from "bun:test";
import { TokenService } from "../../../src/modules/auth/services/token.service";

describe("TokenService (unit)", () => {
  it("signs an access token that verifies back to the same claims", async () => {
    const token = await TokenService.signAccessToken({
      userId: "user-1",
      sessionId: "session-1",
    });

    const claims = await TokenService.verifyAccessToken(token);
    expect(claims).toEqual({ userId: "user-1", sessionId: "session-1" });
  });

  it("rejects a garbage token", async () => {
    const claims = await TokenService.verifyAccessToken("not-a-real-token");
    expect(claims).toBeNull();
  });

  it("rejects a token signed with a different secret", async () => {
    const { SignJWT } = await import("jose");
    const wrongKey = new TextEncoder().encode("a-completely-different-secret-key-value");
    const forgedToken = await new SignJWT({ sid: "session-1" })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject("user-1")
      .setIssuedAt()
      .setExpirationTime("15m")
      .sign(wrongKey);

    const claims = await TokenService.verifyAccessToken(forgedToken);
    expect(claims).toBeNull();
  });

  it("generates opaque tokens that hash deterministically", () => {
    const token = TokenService.generateOpaqueToken();
    const hashOne = TokenService.hashOpaqueToken(token);
    const hashTwo = TokenService.hashOpaqueToken(token);

    expect(hashOne).toBe(hashTwo);
    expect(hashOne).not.toBe(token);
  });

  it("generates unique opaque tokens across calls", () => {
    const tokens = new Set(Array.from({ length: 20 }, () => TokenService.generateOpaqueToken()));
    expect(tokens.size).toBe(20);
  });
});
