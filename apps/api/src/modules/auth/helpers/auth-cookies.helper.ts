import type { Response } from "express";
import { env } from "../../../infrastructure/config/env";
import type { IssuedSession } from "../types/auth.types";

const isProduction = env.NODE_ENV === "production";

const baseCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: (isProduction ? "none" : "lax") as "none" | "lax",
  path: "/",
};

export const setAuthCookies = (res: Response, session: IssuedSession): void => {
  res.cookie(env.AUTH_ACCESS_COOKIE_NAME, session.accessToken, {
    ...baseCookieOptions,
    expires: session.accessTokenExpiresAt,
  });

  res.cookie(env.AUTH_REFRESH_COOKIE_NAME, session.refreshToken, {
    ...baseCookieOptions,
    expires: session.refreshTokenExpiresAt,
  });
};

export const clearAuthCookies = (res: Response): void => {
  res.clearCookie(env.AUTH_ACCESS_COOKIE_NAME, baseCookieOptions);
  res.clearCookie(env.AUTH_REFRESH_COOKIE_NAME, baseCookieOptions);
};

// No cookie-parser middleware is installed in this app (see requireTrustedOriginForMutations
// and the historical Better Auth setup, both of which read the raw header) —
// stay consistent and parse the `Cookie` header by hand.
export const parseCookie = (
  cookieHeader: string | string[] | undefined,
  name: string,
): string | null => {
  if (!cookieHeader) {
    return null;
  }

  const header = Array.isArray(cookieHeader) ? cookieHeader.join("; ") : cookieHeader;

  // If a proxy or the browser sends the same cookie name twice, prefer the
  // last occurrence — matches standard cookie-jar precedence.
  let value: string | null = null;
  for (const part of header.split(";")) {
    const separatorIndex = part.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }

    const cookieName = part.slice(0, separatorIndex).trim();
    if (cookieName === name) {
      value = decodeURIComponent(part.slice(separatorIndex + 1).trim());
    }
  }

  return value;
};

export const getDeviceInfoFromRequest = (req: {
  headers: Record<string, unknown>;
  ip?: string;
}): { userAgent: string | null; ipAddress: string | null } => {
  const userAgent = req.headers["user-agent"];
  return {
    userAgent: typeof userAgent === "string" ? userAgent : null,
    ipAddress: req.ip ?? null,
  };
};
