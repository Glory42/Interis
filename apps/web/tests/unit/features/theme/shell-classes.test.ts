import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const SRC = resolve(__dirname, "../../../../src");

const sourceFiles = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(tsx?|css)$/.test(name) ? [path] : [];
  });

describe("shell classes", () => {
  it("uses the one .shell set instead of per-page profile/settings/developer copies", () => {
    const offenders = sourceFiles(SRC).filter((path) =>
      /\b(profile|settings|developer)-shell\b/.test(readFileSync(path, "utf8")),
    );

    expect(offenders.map((path) => path.slice(SRC.length + 1))).toEqual([]);
  });
});
