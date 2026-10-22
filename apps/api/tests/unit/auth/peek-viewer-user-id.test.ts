import { describe, expect, it } from "bun:test";
import { peekViewerUserIdFromHeaders } from "../../../src/commons/auth/session-resolver.helper";
import { TokenService } from "../../../src/modules/auth/services/token.service";
import { env } from "../../../src/infrastructure/config/env";

describe("peekViewerUserIdFromHeaders", () => {
  it("returns the user id from a validly signed access cookie", async () => {
    const token = await TokenService.signAccessToken({ userId: "user-1", sessionId: "s-1" });
    const cookie = `${env.AUTH_ACCESS_COOKIE_NAME}=${token}`;
    expect(await peekViewerUserIdFromHeaders({ cookie })).toBe("user-1");
  });

  it("returns null with no cookie or a tampered token", async () => {
    expect(await peekViewerUserIdFromHeaders({})).toBeNull();
    const cookie = `${env.AUTH_ACCESS_COOKIE_NAME}=not-a-jwt`;
    expect(await peekViewerUserIdFromHeaders({ cookie })).toBeNull();
  });
});
