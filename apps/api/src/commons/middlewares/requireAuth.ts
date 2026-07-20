import type { Request, Response, NextFunction } from "express";
import { eq } from "drizzle-orm";
import {
  getAccessTokenFromHeaders,
  getRefreshTokenFromHeaders,
  resolveSessionFromAccessToken,
} from "../auth/session-resolver.helper";
import { SessionService } from "../../modules/auth/services/session.service";
import { AuthUsersRepository } from "../../modules/auth/repositories/auth-users.repository";
import { toAuthUser } from "../../modules/auth/helpers/auth-user-mapper.helper";
import { setAuthCookies } from "../../modules/auth/helpers/auth-cookies.helper";
import { sendUnauthorized, sendForbidden } from "../http/validation-response.helper";
import { db } from "../../infrastructure/database/db";
import { profiles } from "../../modules/users/users.entity";

// One lookup covers both the suspension gate and requireAdmin's later check
// (cached on req.session.isAdmin) so admin routes don't pay for a second
// profiles round-trip.
const resolveProfileFlags = async (
  userId: string,
): Promise<{ isAdmin: boolean; isSuspended: boolean } | null> => {
  const [profile] = await db
    .select({ isAdmin: profiles.isAdmin, isSuspended: profiles.isSuspended })
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1);

  return profile ?? null;
};

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const accessToken = getAccessTokenFromHeaders(req.headers);
  const resolved = await resolveSessionFromAccessToken(accessToken);

  if (resolved) {
    const profile = await resolveProfileFlags(resolved.user.id);
    if (profile?.isSuspended) {
      sendForbidden(res, "Account suspended");
      return;
    }

    req.user = resolved.user;
    req.session = {
      id: resolved.sessionId,
      userId: resolved.user.id,
      isAdmin: profile?.isAdmin ?? false,
    };
    next();
    return;
  }

  // Access token missing/expired/revoked — try a transparent refresh so an
  // active user isn't logged out just because the 15-minute access token
  // lapsed while the tab was idle.
  const refreshToken = getRefreshTokenFromHeaders(req.headers);
  if (!refreshToken) {
    sendUnauthorized(res);
    return;
  }

  const rotated = await SessionService.rotateRefreshToken(refreshToken);
  if (!rotated) {
    sendUnauthorized(res);
    return;
  }

  const userRow = await AuthUsersRepository.findById(rotated.userId);
  if (!userRow) {
    sendUnauthorized(res);
    return;
  }

  const profile = await resolveProfileFlags(rotated.userId);
  if (profile?.isSuspended) {
    sendForbidden(res, "Account suspended");
    return;
  }

  setAuthCookies(res, rotated);
  req.user = toAuthUser(userRow);
  req.session = { id: rotated.sessionId, userId: rotated.userId, isAdmin: profile?.isAdmin ?? false };
  next();
};
