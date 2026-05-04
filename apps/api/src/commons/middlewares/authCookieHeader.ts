const AUTH_COOKIE_NAMES = new Set([
  "better-auth.session_token",
  "better-auth.session_data",
  "better-auth.dont_remember",
  "better-auth-session_token",
  "better-auth-session_data",
  "better-auth-dont_remember",
  "__Secure-better-auth.session_token",
  "__Secure-better-auth.session_data",
  "__Secure-better-auth.dont_remember",
  "__Secure-better-auth-session_token",
  "__Secure-better-auth-session_data",
  "__Secure-better-auth-dont_remember",
]);

const getCookieName = (cookie: string): string | null => {
  const separatorIndex = cookie.indexOf("=");
  if (separatorIndex <= 0) {
    return null;
  }

  const name = cookie.slice(0, separatorIndex).trim();
  return name.length > 0 ? name : null;
};

export const normalizeAuthCookieHeader = (header: string): string => {
  const cookies = header
    .split(";")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

  if (cookies.length <= 1) {
    return header;
  }

  const seenAuthCookies = new Set<string>();
  const normalized: string[] = [];
  let removedDuplicateAuthCookie = false;

  for (let index = cookies.length - 1; index >= 0; index -= 1) {
    const cookie = cookies[index];
    if (!cookie) {
      continue;
    }

    const cookieName = getCookieName(cookie);
    if (!cookieName) {
      normalized.push(cookie);
      continue;
    }

    if (!AUTH_COOKIE_NAMES.has(cookieName)) {
      normalized.push(cookie);
      continue;
    }

    if (seenAuthCookies.has(cookieName)) {
      removedDuplicateAuthCookie = true;
      continue;
    }

    seenAuthCookies.add(cookieName);
    normalized.push(cookie);
  }

  if (!removedDuplicateAuthCookie) {
    return header;
  }

  return normalized.reverse().join("; ");
};
