import type { Context, Next } from "hono";
import type { AppEnv } from "../../infrastructure/http/hono-context.types";
import {
  getAccessTokenFromHonoContext,
  getRefreshTokenFromHonoContext,
  resolveSessionFromAccessToken,
} from "../auth/session-resolver.hono";
import { SessionService } from "../../modules/auth/services/session.service";
import { AuthUsersRepository } from "../../modules/auth/repositories/auth-users.repository";
import { toAuthUser } from "../../modules/auth/helpers/auth-user-mapper.helper";
import { setAuthCookies } from "../../modules/auth/helpers/auth-cookies.hono";
import { sendUnauthorized } from "../http/validation-response.hono";

export const requireAuth = async (c: Context<AppEnv>, next: Next): Promise<Response | void> => {
  const accessToken = getAccessTokenFromHonoContext(c);
  const resolved = await resolveSessionFromAccessToken(accessToken);

  if (resolved) {
    c.set("user", resolved.user);
    c.set("session", { id: resolved.sessionId, userId: resolved.user.id });
    await next();
    return;
  }

  // Access token missing/expired/revoked — try a transparent refresh so an
  // active user isn't logged out just because the 15-minute access token
  // lapsed while the tab was idle.
  const refreshToken = getRefreshTokenFromHonoContext(c);
  if (!refreshToken) {
    return sendUnauthorized(c);
  }

  const rotated = await SessionService.rotateRefreshToken(refreshToken);
  if (!rotated) {
    return sendUnauthorized(c);
  }

  const userRow = await AuthUsersRepository.findById(rotated.userId);
  if (!userRow) {
    return sendUnauthorized(c);
  }

  setAuthCookies(c, rotated);
  c.set("user", toAuthUser(userRow));
  c.set("session", { id: rotated.sessionId, userId: rotated.userId });
  await next();
};
