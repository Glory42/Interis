import type { Request, Response, NextFunction } from "express";
import {
  getAccessTokenFromHeaders,
  getRefreshTokenFromHeaders,
  resolveSessionFromAccessToken,
} from "../auth/session-resolver.helper";
import { SessionService } from "../../modules/auth/services/session.service";
import { AuthUsersRepository } from "../../modules/auth/repositories/auth-users.repository";
import { toAuthUser } from "../../modules/auth/helpers/auth-user-mapper.helper";
import { setAuthCookies } from "../../modules/auth/helpers/auth-cookies.helper";
import { sendUnauthorized } from "../http/validation-response.helper";

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const accessToken = getAccessTokenFromHeaders(req.headers);
  const resolved = await resolveSessionFromAccessToken(accessToken);

  if (resolved) {
    req.user = resolved.user;
    req.session = { id: resolved.sessionId, userId: resolved.user.id };
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

  setAuthCookies(res, rotated);
  req.user = toAuthUser(userRow);
  req.session = { id: rotated.sessionId, userId: rotated.userId };
  next();
};
