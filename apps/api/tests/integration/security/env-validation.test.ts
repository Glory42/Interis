import { describe, expect, it } from "bun:test";
import { resolve } from "node:path";
import { tmpdir } from "node:os";

const envFilePath = resolve(import.meta.dir, "../../../src/infrastructure/config/env.ts");
// Bun auto-loads a .env from the child process's cwd regardless of the `env`
// option passed to spawn — run outside the repo so apps/api/.env can't
// silently backfill the vars this test is trying to omit.
const cwdWithoutDotenv = tmpdir();

describe("runtime env validation", () => {
  it("exits 1 with a descriptive message when a required var is missing", async () => {
    const { DATABASE_URL: _omitted, ...envWithoutDatabaseUrl } = process.env;

    const proc = Bun.spawn({
      cmd: ["bun", "run", envFilePath],
      cwd: cwdWithoutDotenv,
      env: envWithoutDatabaseUrl,
      stderr: "pipe",
      stdout: "pipe",
    });

    const [exitCode, stderr] = await Promise.all([
      proc.exited,
      new Response(proc.stderr).text(),
    ]);

    expect(exitCode).toBe(1);
    expect(stderr).toContain("DATABASE_URL");
  });

  it("exits 1 when BETTER_AUTH_URL is not a valid URL", async () => {
    const proc = Bun.spawn({
      cmd: ["bun", "run", envFilePath],
      cwd: cwdWithoutDotenv,
      env: { ...process.env, BETTER_AUTH_URL: "not-a-url" },
      stderr: "pipe",
      stdout: "pipe",
    });

    const [exitCode, stderr] = await Promise.all([
      proc.exited,
      new Response(proc.stderr).text(),
    ]);

    expect(exitCode).toBe(1);
    expect(stderr).toContain("BETTER_AUTH_URL");
  });
});
