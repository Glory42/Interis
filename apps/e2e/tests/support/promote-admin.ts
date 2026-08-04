import { execSync } from "node:child_process";

// There is no self-serve way to get an admin session for e2e - the
// promote-to-admin API route itself requires an existing admin, and
// apps/e2e has no application DB access of its own. This shells out to
// psql against the database the running stack is pointed at (the same
// devDATABASE_URL already used to run e2e in isolation - see
// playwright.config.ts) to flip the flag directly, mirroring
// apps/api/tests/support/factories/admin.factory.ts's direct-DB write for
// backend integration tests. Requires the `psql` CLI and
// E2E_TEST_DATABASE_URL to be available wherever this runs.
//
// Username is always in the buildTestUser format (a fixed lowercase
// prefix + digits, see register-user.ts) - safe to inline into SQL, but
// this is not a general-purpose helper and must never be passed
// user-controlled input.
export const promoteToAdmin = (username: string): void => {
  const databaseUrl = process.env.E2E_TEST_DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      "E2E_TEST_DATABASE_URL must be set to promote a test user to admin (e.g. the same devDATABASE_URL used for E2E_BASE_URL/E2E_API_BASE_URL runs).",
    );
  }

  execSync(
    `psql "${databaseUrl}" -v ON_ERROR_STOP=1 -c "UPDATE profile SET is_admin = true FROM \\"user\\" WHERE profile.user_id = \\"user\\".id AND \\"user\\".username = '${username}'"`,
    { stdio: "pipe" },
  );
};
