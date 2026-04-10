import {
  cookieHeaderFromJar,
  getSetCookies,
  syncCookieJar,
  type CookieJar,
} from "./cookie-jar";

export const apiRequest = async (
  baseUrl: string,
  path: string,
  init: RequestInit = {},
  jar?: CookieJar,
): Promise<Response> => {
  const headers = new Headers(init.headers);

  if (jar && jar.size > 0 && !headers.has("cookie")) {
    headers.set("cookie", cookieHeaderFromJar(jar));
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers,
  });

  if (jar) {
    syncCookieJar(jar, getSetCookies(response));
  }

  return response;
};
