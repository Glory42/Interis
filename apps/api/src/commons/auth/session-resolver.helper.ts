import type { IncomingHttpHeaders } from "node:http";
import { env } from "../../infrastructure/config/env";
import { TokenService } from "../../modules/auth/services/token.service";
import { SessionService } from "../../modules/auth/services/session.service";
import { AuthUsersRepository } from "../../modules/auth/repositories/auth-users.repository";
import { toAuthUser } from "../../modules/auth/helpers/auth-user-mapper.helper";
import { parseCookie } from "../../modules/auth/helpers/auth-cookies.helper";
import type { AuthUser } from "../../modules/auth/types/auth.types";

export type ResolvedAuthSession = {
  user: AuthUser;
  sessionId: string;
};

// Verifies the access-token JWT and confirms the session it points at is
// still active. Does not attempt refresh-token rotation — callers that can
// rotate (i.e. have a `res` to set cookies on) handle that themselves.
export const resolveSessionFromAccessToken = async (
  accessToken: string | null,
): Promise<ResolvedAuthSession | null> => {
  if (!accessToken) {
    return null;
  }

  const claims = await TokenService.verifyAccessToken(accessToken);
  if (!claims) {
    return null;
  }

  const isActive = await SessionService.isSessionActive(claims.sessionId);
  if (!isActive) {
    return null;
  }

  const userRow = await AuthUsersRepository.findById(claims.userId);
  if (!userRow) {
    return null;
  }

  return { user: toAuthUser(userRow), sessionId: claims.sessionId };
};

export const getAccessTokenFromHeaders = (headers: IncomingHttpHeaders): string | null => {
  return parseCookie(headers.cookie, env.AUTH_ACCESS_COOKIE_NAME);
};

export const getRefreshTokenFromHeaders = (headers: IncomingHttpHeaders): string | null => {
  return parseCookie(headers.cookie, env.AUTH_REFRESH_COOKIE_NAME);
};

export const resolveViewerUserIdFromHeaders = async (
  headers: IncomingHttpHeaders,
): Promise<string | null> => {
  const accessToken = getAccessTokenFromHeaders(headers);
  const resolved = await resolveSessionFromAccessToken(accessToken);
  return resolved?.user.id ?? null;
};
