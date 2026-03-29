import type { Request, Response, NextFunction } from "express";
import type { IncomingHttpHeaders } from "node:http";
import { auth } from "../../infrastructure/auth/auth";
import { fromNodeHeaders } from "better-auth/node";
import { normalizeAuthCookieHeader } from "./authCookieHeader";

const toCookieHeader = (cookie: string | string[] | undefined): string | null => {
  if (!cookie) {
    return null;
  }

  return Array.isArray(cookie) ? cookie.join("; ") : cookie;
};

const withCookieHeader = (
  headers: IncomingHttpHeaders,
  cookie: string,
): IncomingHttpHeaders => ({
  ...headers,
  cookie,
});

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const originalCookieHeader = toCookieHeader(req.headers.cookie);
  const normalizedCookieHeader = originalCookieHeader
    ? normalizeAuthCookieHeader(originalCookieHeader)
    : null;

  const headersForAuth = normalizedCookieHeader
    ? withCookieHeader(req.headers, normalizedCookieHeader)
    : req.headers;

  let session = await auth.api.getSession({
    headers: fromNodeHeaders(headersForAuth),
  });

  if (
    !session &&
    originalCookieHeader &&
    normalizedCookieHeader &&
    normalizedCookieHeader !== originalCookieHeader
  ) {
    session = await auth.api.getSession({
      headers: fromNodeHeaders(withCookieHeader(req.headers, originalCookieHeader)),
    });
  }

  if (!session) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  req.user = session.user;
  req.session = session.session;
  next();
};
