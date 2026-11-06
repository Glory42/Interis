import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(resolve(__dirname, "../../../../src/index.css"), "utf8");
const main = readFileSync(resolve(__dirname, "../../../../src/main.tsx"), "utf8");

const ruleBody = (selector: string): string => {
  const start = css.indexOf(`  ${selector} {`);
  expect(start, `${selector} is defined`).toBeGreaterThan(-1);
  return css.slice(start, css.indexOf("}", start));
};

const pxValue = (body: string, property: string): number =>
  Number(new RegExp(`${property}:\\s*([\\d.]+)px`).exec(body)?.[1]);

describe("typography and radius", () => {
  it("loads every font family a theme names first", () => {
    const families = [...css.matchAll(/--theme-(?:body|display|kicker)-font:\s*"([^"]+)"/g)].map(
      (match) => match[1]!,
    );
    const imported = [...main.matchAll(/import "@fontsource(?:-variable)?\/([a-z-]+)/g)].map(
      (match) => match[1]!,
    );

    for (const family of new Set(families)) {
      const pkg = family.replace(/ Variable$/, "").toLowerCase().replace(/ /g, "-");
      expect(imported, `${family} is loaded`).toContain(pkg);
    }
  });

  it("keeps corners between 2 and 4px", () => {
    const radii = [...css.matchAll(/--radius(?:-[a-z0-9]+)?:\s*([^;]+);/g)].map((match) => match[1]!);
    expect(radii.length).toBeGreaterThan(0);
    for (const radius of radii) {
      expect(radius, `radius ${radius}`).toMatch(/^[234]px$/);
    }
  });

  it("defines the type scale with nothing smaller than an 11px caption", () => {
    const scale: Record<string, number> = {
      ".display-1": 30,
      ".display-2": 22,
      ".display-3": 18,
      ".display-4": 15,
      ".body": 14,
      ".body-s": 12.5,
      ".caption": 11,
      ".mono-num": 20,
      ".mono-meta": 11,
      ".kicker": 10,
    };

    for (const [selector, size] of Object.entries(scale)) {
      expect(pxValue(ruleBody(selector), "font-size"), selector).toBe(size);
    }
    expect(ruleBody(".kicker")).toContain("letter-spacing: 0.12em");
  });
});
