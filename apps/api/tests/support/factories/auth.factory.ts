import { randomUUID } from "node:crypto";

const TEST_PASSWORD = "password1234";

export type AuthCredentials = {
  name: string;
  email: string;
  password: string;
  username: string;
  displayUsername: string;
};

const normalizePrefix = (value: string): string => {
  const sanitized = value.toLowerCase().replace(/[^a-z0-9_]+/g, "");
  return sanitized.length > 0 ? sanitized.slice(0, 6) : "u";
};

export const buildAuthCredentials = (prefix = "u"): AuthCredentials => {
  const seed = randomUUID().replace(/-/g, "").slice(0, 12);
  const username = `${normalizePrefix(prefix)}_${seed}`.slice(0, 20);

  return {
    name: username,
    email: `auth-${seed}@example.com`,
    password: TEST_PASSWORD,
    username,
    displayUsername: username,
  };
};
