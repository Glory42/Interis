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
