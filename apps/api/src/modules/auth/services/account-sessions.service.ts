import { BadRequestError, NotFoundError } from "../../../commons/errors/app-error";
import { AuthSessionsRepository } from "../repositories/auth-sessions.repository";
import { describeUserAgent, maskIpAddress } from "../helpers/session-device.helper";
import { AuthService } from "../auth.service";

// Live sessions are pruned and capped by the refresh TTL, so one bounded page is enough.
export const ACCOUNT_SESSIONS_LIMIT = 50;

export type AccountSession = {
  id: string;
  deviceLabel: string;
  ipAddressMasked: string | null;
  createdAt: Date;
  lastActiveAt: Date;
  isCurrent: boolean;
};

// The signed-in user's own sessions, as shown under Settings → Account & security.
export class AccountSessionsService {
  static async list(
    userId: string,
    currentSessionId: string,
  ): Promise<{ sessions: AccountSession[]; hasMore: boolean }> {
    const rows = await AuthSessionsRepository.listLiveForUser(
      userId,
      currentSessionId,
      ACCOUNT_SESSIONS_LIMIT + 1,
    );

    return {
      sessions: rows.slice(0, ACCOUNT_SESSIONS_LIMIT).map((row) => ({
        id: row.id,
        deviceLabel: describeUserAgent(row.userAgent),
        ipAddressMasked: maskIpAddress(row.ipAddress),
        createdAt: row.createdAt,
        lastActiveAt: row.updatedAt,
        isCurrent: row.id === currentSessionId,
      })),
      hasMore: rows.length > ACCOUNT_SESSIONS_LIMIT,
    };
  }

  // The current device signs out through /sign-out, which also clears its cookies.
  static async revoke(userId: string, currentSessionId: string, sessionId: string): Promise<void> {
    if (sessionId === currentSessionId) {
      throw new BadRequestError("Use sign out to end the session on this device");
    }

    const revoked = await AuthSessionsRepository.revokeLiveForUser(sessionId, userId);
    if (!revoked) {
      throw new NotFoundError("Session not found");
    }
  }

  static async revokeOthers(
    userId: string,
    currentSessionId: string,
    currentPassword: string,
  ): Promise<{ revokedCount: number }> {
    await AuthService.assertCurrentPassword(userId, currentPassword);
    const revokedCount = await AuthSessionsRepository.revokeAllForUser(userId, currentSessionId);
    return { revokedCount };
  }
}
