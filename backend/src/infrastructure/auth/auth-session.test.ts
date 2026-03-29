import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import type { Server } from "node:http";
import { sql } from "drizzle-orm";
import { createApp } from "../../index";
import { db } from "../database/db";

type CookieJar = Map<string, string>;

const getSetCookies = (response: Response): string[] => {
  const headers = response.headers as Headers & {
    getSetCookie?: () => string[];
  };

  if (typeof headers.getSetCookie === "function") {
    return headers.getSetCookie();
  }

  const header = response.headers.get("set-cookie");
  return header ? [header] : [];
};

const syncCookieJar = (jar: CookieJar, setCookies: string[]): void => {
  for (const setCookie of setCookies) {
    const [cookiePair] = setCookie.split(";");
    if (!cookiePair) {
      continue;
    }

    const separatorIndex = cookiePair.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }

    const name = cookiePair.slice(0, separatorIndex).trim();
    const value = cookiePair.slice(separatorIndex + 1).trim();
    const shouldDelete =
      value.length === 0 ||
      /max-age=0/i.test(setCookie) ||
      /expires=thu,\s*01\s*jan\s*1970/i.test(setCookie);

    if (shouldDelete) {
      jar.delete(name);
      continue;
    }

    jar.set(name, value);
  }
};

const cookieHeaderFromJar = (jar: CookieJar): string =>
  Array.from(jar.entries())
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");

const apiRequest = async (
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

const randomCredentials = () => {
  const seed = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  const username = `u_${seed}`.slice(0, 20);

  return {
    name: username,
    email: `auth-${seed}@example.com`,
    password: "password1234",
    username,
    displayUsername: username,
  };
};

describe("auth session lifecycle", () => {
  let server: Server | null = null;
  let baseUrl = "";

  beforeAll(async () => {
    await db.execute(sql`
      ALTER TABLE "profile"
      ADD COLUMN IF NOT EXISTS "favorite_genres" jsonb DEFAULT '[]'::jsonb NOT NULL;
    `);

    const app = createApp();
    await new Promise<void>((resolve, reject) => {
      server = app.listen(0, () => resolve());
      server.on("error", reject);
    });

    if (!server) {
      throw new Error("Server did not start");
    }

    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("Could not resolve server address");
    }

    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterAll(async () => {
    const activeServer = server;
    if (!activeServer) {
      return;
    }

    await new Promise<void>((resolve, reject) => {
      activeServer.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  });

  it("returns 401 for /api/users/me without a session", async () => {
    const response = await apiRequest(baseUrl, "/api/users/me");
    expect(response.status).toBe(401);
  });

  it("rejects reserved usernames during sign-up", async () => {
    const response = await apiRequest(baseUrl, "/api/auth/sign-up/email", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: "anonymous",
        username: "anonymous",
        displayUsername: "anonymous",
        email: `reserved-${Date.now()}@example.com`,
        password: "password1234",
      }),
    });

    expect(response.status).toBe(400);
  });

  it("keeps auth valid with duplicate session_token cookies and clears on sign-out", async () => {
    const credentials = randomCredentials();
    const jar = new Map<string, string>();

    const signUpResponse = await apiRequest(
      baseUrl,
      "/api/auth/sign-up/email",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(credentials),
      },
      jar,
    );
    expect(signUpResponse.ok).toBe(true);

    const signInResponse = await apiRequest(
      baseUrl,
      "/api/auth/sign-in/email",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password,
        }),
      },
      jar,
    );
    expect(signInResponse.ok).toBe(true);

    const initialMeResponse = await apiRequest(baseUrl, "/api/users/me", {}, jar);
    expect(initialMeResponse.status).toBe(200);

    const sessionCookieName = [...jar.keys()].find((name) =>
      name.endsWith("session_token"),
    );
    if (!sessionCookieName) {
      throw new Error("Session token cookie not found");
    }

    const staleToken = jar.get(sessionCookieName);
    if (!staleToken) {
      throw new Error("Signed stale token not found");
    }

    const firstSignOut = await apiRequest(
      baseUrl,
      "/api/auth/sign-out",
      { method: "POST" },
      jar,
    );
    expect(firstSignOut.ok).toBe(true);

    const secondSignIn = await apiRequest(
      baseUrl,
      "/api/auth/sign-in/email",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password,
        }),
      },
      jar,
    );
    expect(secondSignIn.ok).toBe(true);

    const freshToken = jar.get(sessionCookieName);
    if (!freshToken) {
      throw new Error("Signed fresh token not found");
    }

    const duplicateCookieHeader = `${sessionCookieName}=${staleToken}; ${sessionCookieName}=${freshToken}`;
    const duplicateCookieResponse = await apiRequest(baseUrl, "/api/users/me", {
      headers: {
        cookie: duplicateCookieHeader,
      },
    });
    expect(duplicateCookieResponse.status).toBe(200);

    const signOutResponse = await apiRequest(
      baseUrl,
      "/api/auth/sign-out",
      { method: "POST" },
      jar,
    );
    expect(signOutResponse.ok).toBe(true);

    const postSignOutMeResponse = await apiRequest(baseUrl, "/api/users/me", {}, jar);
    expect(postSignOutMeResponse.status).toBe(401);
  });
});
