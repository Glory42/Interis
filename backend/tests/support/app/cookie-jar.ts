export type CookieJar = Map<string, string>;

type CookieHeaders = Headers & {
  getSetCookie?: () => string[];
};

export const createCookieJar = (): CookieJar => new Map<string, string>();

export const getSetCookies = (response: Response): string[] => {
  const headers = response.headers as CookieHeaders;

  if (typeof headers.getSetCookie === "function") {
    return headers.getSetCookie();
  }

  const fallbackHeader = response.headers.get("set-cookie");
  return fallbackHeader ? [fallbackHeader] : [];
};

const getCookiePairFromSetCookie = (setCookieHeader: string): string | null => {
  const [cookiePair] = setCookieHeader.split(";");
  if (!cookiePair) {
    return null;
  }

  return cookiePair;
};

const shouldDeleteCookie = (cookieValue: string, setCookieHeader: string): boolean => {
  return (
    cookieValue.length === 0 ||
    /max-age=0/i.test(setCookieHeader) ||
    /expires=thu,\s*01\s*jan\s*1970/i.test(setCookieHeader)
  );
};

export const syncCookieJar = (jar: CookieJar, setCookies: string[]): void => {
  for (const setCookieHeader of setCookies) {
    const cookiePair = getCookiePairFromSetCookie(setCookieHeader);
    if (!cookiePair) {
      continue;
    }

    const separatorIndex = cookiePair.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }

    const cookieName = cookiePair.slice(0, separatorIndex).trim();
    const cookieValue = cookiePair.slice(separatorIndex + 1).trim();

    if (shouldDeleteCookie(cookieValue, setCookieHeader)) {
      jar.delete(cookieName);
      continue;
    }

    jar.set(cookieName, cookieValue);
  }
};

export const cookieHeaderFromJar = (jar: CookieJar): string => {
  return Array.from(jar.entries())
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");
};
