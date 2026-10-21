import { randomUUID } from "node:crypto";
import { env } from "../../../infrastructure/config/env";
import {
  AuthSessionsRepository,
  type AuthSessionRow,
} from "../repositories/auth-sessions.repository";
import { TokenService } from "./token.service";
import type { IssuedSession, SessionDeviceInfo } from "../types/auth.types";

const isActive = (session: Pick<AuthSessionRow, "revokedAt" | "expiresAt">): boolean => {
  return !session.revokedAt && session.expiresAt.getTime() > Date.now();
};

// Revoked sessions are kept this long so a replayed refresh token is still
// recognised as theft (see rotateRefreshToken), then pruned.
const DEAD_SESSION_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

const issueForSession = async (
  sessionId: string,
  userId: string,
  refreshToken: string,
  refreshTokenExpiresAt: Date,
): Promise<IssuedSession> => {
  const accessToken = await TokenService.signAccessToken({ userId, sessionId });

  return {
    sessionId,
    userId,
    accessToken,
    accessTokenExpiresAt: new Date(Date.now() + env.JWT_ACCESS_TTL_SECONDS * 1000),
    refreshToken,
    refreshTokenExpiresAt,
  };
};

export class SessionService {
  static async createSession(
    userId: string,
    deviceInfo: SessionDeviceInfo = {},
  ): Promise<IssuedSession> {
    const sessionId = randomUUID();
    const refreshToken = TokenService.generateOpaqueToken();
    const refreshTokenExpiresAt = new Date(
      Date.now() + env.REFRESH_TOKEN_TTL_SECONDS * 1000,
    );

    await AuthSessionsRepository.insert({
      id: sessionId,
      userId,
      refreshTokenHash: TokenService.hashOpaqueToken(refreshToken),
      userAgent: deviceInfo.userAgent ?? null,
      ipAddress: deviceInfo.ipAddress ?? null,
      expiresAt: refreshTokenExpiresAt,
    });

    // Sessions were never deleted, only marked revoked; prune on login (rare, cheap)
    // so the table doesn't grow forever. Best-effort - never blocks the login.
    void AuthSessionsRepository.deleteExpiredOrRevokedBefore(
      new Date(Date.now() - DEAD_SESSION_RETENTION_MS),
    ).catch(() => undefined);

    return issueForSession(sessionId, userId, refreshToken, refreshTokenExpiresAt);
  }

  // Active session joined with its user and profile flags, or null if the
  // session is missing, revoked, expired, or belongs to a different user.
  static async findActiveSessionContext(sessionId: string, userId: string) {
    const context = await AuthSessionsRepository.findSessionContext(sessionId);
    if (!context || context.sessionUserId !== userId || !isActive(context)) {
      return null;
    }

    return {
      user: context.user,
      profileFlags:
        context.isAdmin === null || context.isSuspended === null
          ? null
          : { isAdmin: context.isAdmin, isSuspended: context.isSuspended },
    };
  }

  // Validates that an access token's referenced session is still live —
  // called on every requireAuth hit so logout/revocation takes effect
  // immediately instead of waiting out the access token's TTL.
  static async isSessionActive(sessionId: string): Promise<boolean> {
    const session = await AuthSessionsRepository.findById(sessionId);
    return session !== null && isActive(session);
  }

  // Rotate-on-use: a valid refresh token issues a new access+refresh pair
  // and the old refresh hash is kept one generation back (see
  // `previousRefreshTokenHash`) so replaying it is detectable.
  static async rotateRefreshToken(refreshToken: string): Promise<IssuedSession | null> {
    const hash = TokenService.hashOpaqueToken(refreshToken);
    const session = await AuthSessionsRepository.findByRefreshTokenHash(hash);

    if (session) {
      if (!isActive(session)) {
        return null;
      }

      const newRefreshToken = TokenService.generateOpaqueToken();
      const newExpiresAt = new Date(Date.now() + env.REFRESH_TOKEN_TTL_SECONDS * 1000);

      await AuthSessionsRepository.rotateRefreshToken(
        session.id,
        hash,
        TokenService.hashOpaqueToken(newRefreshToken),
        newExpiresAt,
      );

      return issueForSession(session.id, session.userId, newRefreshToken, newExpiresAt);
    }

    // Not the current refresh token for any session — check whether it's a
    // stale, already-rotated one being replayed. If so, treat the session
    // as compromised and kill it outright.
    const replayedSession = await AuthSessionsRepository.findByPreviousRefreshTokenHash(
      hash,
    );
    if (replayedSession && isActive(replayedSession)) {
      await AuthSessionsRepository.revoke(replayedSession.id);
    }

    return null;
  }

  static async revokeSessionByRefreshToken(refreshToken: string): Promise<void> {
    const hash = TokenService.hashOpaqueToken(refreshToken);
    const session = await AuthSessionsRepository.findByRefreshTokenHash(hash);
    if (session) {
      await AuthSessionsRepository.revoke(session.id);
    }
  }

  static async revokeSession(sessionId: string): Promise<void> {
    await AuthSessionsRepository.revoke(sessionId);
  }

  static async revokeAllSessionsForUser(
    userId: string,
    exceptSessionId?: string,
  ): Promise<void> {
    await AuthSessionsRepository.revokeAllForUser(userId, exceptSessionId);
  }

  static async listSessionsForUser(userId: string): Promise<AuthSessionRow[]> {
    return AuthSessionsRepository.listActiveForUser(userId);
  }
}
