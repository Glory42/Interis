import type { IncomingHttpHeaders } from "node:http";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../../infrastructure/auth/auth";
import { normalizeAuthCookieHeader } from "../middlewares/authCookieHeader";

type AuthSession = Awaited<ReturnType<typeof auth.api.getSession>>;

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

export const resolveSessionFromHeaders = async (
  headers: IncomingHttpHeaders,
): Promise<AuthSession> => {
  const originalCookieHeader = toCookieHeader(headers.cookie);
  const normalizedCookieHeader = originalCookieHeader
    ? normalizeAuthCookieHeader(originalCookieHeader)
    : null;

  const headersForAuth = normalizedCookieHeader
    ? withCookieHeader(headers, normalizedCookieHeader)
    : headers;

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
      headers: fromNodeHeaders(withCookieHeader(headers, originalCookieHeader)),
    });
  }

  return session;
};

export const resolveViewerUserIdFromHeaders = async (
  headers: IncomingHttpHeaders,
): Promise<string | null> => {
  const session = await resolveSessionFromHeaders(headers);
  return session?.user.id ?? null;
};
