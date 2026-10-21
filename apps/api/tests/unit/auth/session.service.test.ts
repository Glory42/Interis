import { beforeEach, describe, expect, it, mock } from "bun:test";

const insertMock = mock(() => Promise.resolve());
const findByIdMock = mock(() => Promise.resolve<unknown>(null));
const findByRefreshTokenHashMock = mock(() => Promise.resolve<unknown>(null));
const findByPreviousRefreshTokenHashMock = mock(() => Promise.resolve<unknown>(null));
const rotateRefreshTokenMock = mock(() => Promise.resolve());
const revokeMock = mock(() => Promise.resolve());
const revokeAllForUserMock = mock(() => Promise.resolve());
const listActiveForUserMock = mock(() => Promise.resolve([]));
const findSessionContextMock = mock(() => Promise.resolve<unknown>(null));
const deleteExpiredOrRevokedBeforeMock = mock((_cutoff: Date) => Promise.resolve());

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
    findSessionContext: findSessionContextMock,
    deleteExpiredOrRevokedBefore: deleteExpiredOrRevokedBeforeMock,
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
    findSessionContextMock.mockClear();
    deleteExpiredOrRevokedBeforeMock.mockClear();
  });

  it("prunes sessions dead for over a week when a new session is created", async () => {
    await SessionService.createSession("user-1");

    expect(deleteExpiredOrRevokedBeforeMock).toHaveBeenCalledTimes(1);
    const cutoff = deleteExpiredOrRevokedBeforeMock.mock.calls[0]![0];
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    expect(Math.abs(cutoff.getTime() - sevenDaysAgo)).toBeLessThan(5_000);
  });

  it("findActiveSessionContext returns user + profile flags for a live session", async () => {
    const userRow = {
      id: "user-1",
      email: "a@b.c",
      username: "a",
      displayUsername: "a",
      name: "A",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    findSessionContextMock.mockImplementationOnce(() =>
      Promise.resolve({
        ...activeSession(),
        sessionUserId: "user-1",
        user: userRow,
        isAdmin: true,
        isSuspended: false,
      }),
    );

    const context = await SessionService.findActiveSessionContext("session-1", "user-1");

    expect(context?.user).toEqual(userRow);
    expect(context?.profileFlags).toEqual({ isAdmin: true, isSuspended: false });
  });

  it("findActiveSessionContext rejects revoked sessions and mismatched users", async () => {
    const base = { sessionUserId: "user-1", user: { id: "user-1" }, isAdmin: false, isSuspended: false };
    findSessionContextMock.mockImplementationOnce(() =>
      Promise.resolve({ ...activeSession({ revokedAt: new Date() }), ...base }),
    );
    expect(await SessionService.findActiveSessionContext("session-1", "user-1")).toBeNull();

    findSessionContextMock.mockImplementationOnce(() =>
      Promise.resolve({ ...activeSession(), ...base }),
    );
    expect(await SessionService.findActiveSessionContext("session-1", "user-2")).toBeNull();
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
