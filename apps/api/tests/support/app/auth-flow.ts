import { buildAuthCredentials } from "../factories/auth.factory";
import { createCookieJar, type CookieJar } from "./cookie-jar";
import { apiRequest } from "./http-client";

export type SignedUpTestUser = {
  jar: CookieJar;
  username: string;
  email: string;
};

export const signUpTestUser = async (
  baseUrl: string,
  prefix = "u",
): Promise<SignedUpTestUser> => {
  const credentials = buildAuthCredentials(prefix);
  const jar = createCookieJar();

  const response = await apiRequest(
    baseUrl,
    "/api/auth/sign-up/email",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(credentials),
    },
    jar,
  );

  if (!response.ok) {
    throw new Error(`Failed to sign up test user: ${response.status}`);
  }

  return { jar, username: credentials.username, email: credentials.email };
};
