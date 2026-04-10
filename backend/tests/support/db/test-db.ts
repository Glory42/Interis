export const isLikelyTestDatabaseUrl = (databaseUrl: string): boolean => {
  return /(^|[_\-])test([_\-]|$)/i.test(databaseUrl);
};

export const getDatabaseUrl = (): string => {
  const databaseUrl = process.env.DATABASE_URL ?? "";
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required for backend tests");
  }

  return databaseUrl;
};

export const assertResetAllowed = (): void => {
  const databaseUrl = getDatabaseUrl();
  const allowManualOverride = process.env.TEST_DB_ALLOW_RESET === "1";

  if (isLikelyTestDatabaseUrl(databaseUrl) || allowManualOverride) {
    return;
  }

  throw new Error(
    "Refusing to reset DATABASE_URL because it does not look like a test DB. Set TEST_DB_ALLOW_RESET=1 to override.",
  );
};
