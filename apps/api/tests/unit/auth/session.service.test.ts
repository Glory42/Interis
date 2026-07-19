import { beforeEach, describe, expect, it, mock } from "bun:test";

const insertMock = mock(() => Promise.resolve());
const findByIdMock = mock(() => Promise.resolve<unknown>(null));
const findByRefreshTokenHashMock = mock(() => Promise.resolve<unknown>(null));
const findByPreviousRefreshTokenHashMock = mock(() => Promise.resolve<unknown>(null));
const rotateRefreshTokenMock = mock(() => Promise.resolve());
const revokeMock = mock(() => Promise.resolve());
const revokeAllForUserMock = mock(() => Promise.resolve());
const listActiveForUserMock = mock(() => Promise.resolve([]));

mock.module("../../../src/modules/auth/repositories/auth-sessions.repository", () => ({
  AuthSessionsRepository: {
    insert: insertMock,
    findById: findByIdMock,
    findByRefreshTokenHash: findByRefreshTokenHashMock,
    findByPreviousRefreshTokenHash: findByPreviousRefreshTokenHashMock,
    rotateRefreshToken: rotateRefreshTokenMock,
    revoke: revokeMock,
    revokeAllForUser: revokeAllForUserMock,
    listActiveForUser: listActiveForUserMock,
  },
}));

const { SessionService } = await import("../../../src/modules/auth/services/session.service");
const { TokenService } = await import("../../../src/modules/auth/services/token.service");

const activeSession = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: "session-1",
  userId: "user-1",
  refreshTokenHash: "current-hash",
  previousRefreshTokenHash: null,
  revokedAt: null,
  expiresAt: new Date(Date.now() + 60_000),
  ...overrides,
});

describe("SessionService (unit)", () => {
  beforeEach(() => {
    insertMock.mockClear();
    findByIdMock.mockClear();
    findByRefreshTokenHashMock.mockClear();
    findByPreviousRefreshTokenHashMock.mockClear();
    rotateRefreshTokenMock.mockClear();
    revokeMock.mockClear();
    revokeAllForUserMock.mockClear();
    listActiveForUserMock.mockClear();
  });

  it("creates a session and issues an access+refresh pair", async () => {
    const issued = await SessionService.createSession("user-1", { userAgent: "test-agent" });

    expect(insertMock).toHaveBeenCalledTimes(1);
    expect(issued.userId).toBe("user-1");
    expect(issued.accessToken).toBeTruthy();
    expect(issued.refreshToken).toBeTruthy();

    const claims = await TokenService.verifyAccessToken(issued.accessToken);
    expect(claims?.userId).toBe("user-1");
    expect(claims?.sessionId).toBe(issued.sessionId);
  });

  it("rotates the refresh token for a valid, active session", async () => {
    const session = activeSession();
    findByRefreshTokenHashMock.mockResolvedValueOnce(session);

    const issued = await SessionService.rotateRefreshToken("some-refresh-token");

    expect(issued).not.toBeNull();
    expect(issued?.sessionId).toBe(session.id);
    expect(issued?.userId).toBe(session.userId);
    expect(rotateRefreshTokenMock).toHaveBeenCalledTimes(1);
    expect(revokeMock).not.toHaveBeenCalled();
  });

  it("refuses to rotate a revoked session", async () => {
    findByRefreshTokenHashMock.mockResolvedValueOnce(
      activeSession({ revokedAt: new Date() }),
    );

    const issued = await SessionService.rotateRefreshToken("some-refresh-token");

    expect(issued).toBeNull();
    expect(rotateRefreshTokenMock).not.toHaveBeenCalled();
  });

  it("treats a replayed (already-rotated) refresh token as compromise and revokes the session", async () => {
    findByRefreshTokenHashMock.mockResolvedValueOnce(null);
    findByPreviousRefreshTokenHashMock.mockResolvedValueOnce(activeSession());

    const issued = await SessionService.rotateRefreshToken("stale-refresh-token");

    expect(issued).toBeNull();
    expect(revokeMock).toHaveBeenCalledWith("session-1");
  });

  it("returns null for a token that matches neither current nor previous hash", async () => {
    findByRefreshTokenHashMock.mockResolvedValueOnce(null);
    findByPreviousRefreshTokenHashMock.mockResolvedValueOnce(null);

    const issued = await SessionService.rotateRefreshToken("unknown-token");

    expect(issued).toBeNull();
    expect(revokeMock).not.toHaveBeenCalled();
  });

  it("isSessionActive reflects revocation", async () => {
    findByIdMock.mockResolvedValueOnce(activeSession());
    expect(await SessionService.isSessionActive("session-1")).toBe(true);

    findByIdMock.mockResolvedValueOnce(activeSession({ revokedAt: new Date() }));
    expect(await SessionService.isSessionActive("session-1")).toBe(false);

    findByIdMock.mockResolvedValueOnce(null);
    expect(await SessionService.isSessionActive("session-1")).toBe(false);
  });
});
