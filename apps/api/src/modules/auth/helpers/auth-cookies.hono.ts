import type { Context } from "hono";
import { setCookie, deleteCookie } from "hono/cookie";
import { env } from "../../../infrastructure/config/env";
import type { IssuedSession } from "../types/auth.types";
import { parseCookie } from "./auth-cookies.helper";

export { parseCookie };

const isProduction = env.NODE_ENV === "production";

const baseCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: (isProduction ? "none" : "lax") as "none" | "lax",
  path: "/",
};

export const setAuthCookies = (c: Context, session: IssuedSession): void => {
  setCookie(c, env.AUTH_ACCESS_COOKIE_NAME, session.accessToken, {
    ...baseCookieOptions,
    expires: session.accessTokenExpiresAt,
  });

  setCookie(c, env.AUTH_REFRESH_COOKIE_NAME, session.refreshToken, {
    ...baseCookieOptions,
    expires: session.refreshTokenExpiresAt,
  });
};

export const clearAuthCookies = (c: Context): void => {
  deleteCookie(c, env.AUTH_ACCESS_COOKIE_NAME, baseCookieOptions);
  deleteCookie(c, env.AUTH_REFRESH_COOKIE_NAME, baseCookieOptions);
};

// X-Forwarded-For instead of a direct socket address (what Express's req.ip
// returned) — works identically under the transitional node-server adapter
// and native Bun.serve, and matches a real deployment behind a proxy/CDN.
export const getDeviceInfoFromHonoContext = (
  c: Context,
): { userAgent: string | null; ipAddress: string | null } => {
  const userAgent = c.req.header("user-agent") ?? null;
  const ipAddress = c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  return { userAgent, ipAddress };
};
