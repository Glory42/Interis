export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 20;
export const USERNAME_PATTERN = /^[a-z0-9_]+$/;

export const RESERVED_USERNAMES = new Set<string>([
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
]);

export const normalizeUsername = (username: string): string =>
  username.trim().toLowerCase();

export const validateUsernameInput = (rawUsername: string): string | null => {
  const username = normalizeUsername(rawUsername);

  if (
    username.length < USERNAME_MIN_LENGTH ||
    username.length > USERNAME_MAX_LENGTH
  ) {
    return `Username must be ${USERNAME_MIN_LENGTH}-${USERNAME_MAX_LENGTH} characters.`;
  }

  if (!USERNAME_PATTERN.test(username)) {
    return "Username can only contain lowercase letters, numbers, and underscores.";
  }

  if (RESERVED_USERNAMES.has(username)) {
    return "This username is reserved. Choose another one.";
  }

  return null;
};
