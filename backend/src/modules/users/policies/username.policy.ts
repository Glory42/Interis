export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 20;
export const USERNAME_PATTERN = /^[a-z0-9_]+$/;

export const RESERVED_USERNAMES = [
  "anonymous",
  "admin",
  "api",
  "auth",
  "films",
  "login",
  "me",
  "profile",
  "public",
  "register",
  "settings",
] as const;

const RESERVED_USERNAME_SET = new Set<string>(RESERVED_USERNAMES);

export const normalizeUsername = (username: string): string =>
  username.trim().toLowerCase();

export const isUsernameReserved = (username: string): boolean =>
  RESERVED_USERNAME_SET.has(username);

export const isUsernameValid = (username: string): boolean => {
  if (username.length < USERNAME_MIN_LENGTH || username.length > USERNAME_MAX_LENGTH) {
    return false;
  }

  if (!USERNAME_PATTERN.test(username)) {
    return false;
  }

  return !isUsernameReserved(username);
};
