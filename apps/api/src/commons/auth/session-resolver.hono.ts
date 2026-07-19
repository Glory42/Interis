import type { Context } from "hono";
import { env } from "../../infrastructure/config/env";
import { parseCookie } from "../../modules/auth/helpers/auth-cookies.helper";
import { resolveSessionFromAccessToken, type ResolvedAuthSession } from "./session-resolver.helper";

export { resolveSessionFromAccessToken, type ResolvedAuthSession };

export const getAccessTokenFromHonoContext = (c: Context): string | null =>
  parseCookie(c.req.header("cookie"), env.AUTH_ACCESS_COOKIE_NAME);

export const getRefreshTokenFromHonoContext = (c: Context): string | null =>
  parseCookie(c.req.header("cookie"), env.AUTH_REFRESH_COOKIE_NAME);

export const resolveViewerUserIdFromHonoContext = async (
  c: Context,
): Promise<string | null> => {
  const accessToken = getAccessTokenFromHonoContext(c);
  const resolved = await resolveSessionFromAccessToken(accessToken);
  return resolved?.user.id ?? null;
};
