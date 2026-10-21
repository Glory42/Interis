import type { IncomingHttpHeaders } from "node:http";
import { env } from "../../infrastructure/config/env";
import { TokenService } from "../../modules/auth/services/token.service";
import { SessionService } from "../../modules/auth/services/session.service";
import { toAuthUser } from "../../modules/auth/helpers/auth-user-mapper.helper";
import { parseCookie } from "../../modules/auth/helpers/auth-cookies.helper";
import type { AuthUser } from "../../modules/auth/types/auth.types";

export type ResolvedAuthSession = {
  user: AuthUser;
  sessionId: string;
  // null when the user has no profile row yet.
  profileFlags: { isAdmin: boolean; isSuspended: boolean } | null;
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

  const context = await SessionService.findActiveSessionContext(
    claims.sessionId,
    claims.userId,
  );
  if (!context) {
    return null;
  }

  return {
    user: toAuthUser(context.user),
    sessionId: claims.sessionId,
    profileFlags: context.profileFlags,
  };
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
