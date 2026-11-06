import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { listThemes, resolveThemeId } from "@/features/theme/theme-registry";

// Loads the same registry script index.html runs before React.
beforeAll(() => {
  const source = readFileSync(resolve(__dirname, "../../../../public/theme-registry.js"), "utf8");
  new Function("window", source)(window);
});

const toLinear = (channel: number): number => {
  const value = channel / 255;
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
};

const luminance = (hex: string): number => {
  const value = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((start) => parseInt(value.slice(start, start + 2), 16));
  return 0.2126 * toLinear(r!) + 0.7152 * toLinear(g!) + 0.0722 * toLinear(b!);
};

const contrast = (foreground: string, background: string): number => {
  const [lighter, darker] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (lighter! + 0.05) / (darker! + 0.05);
};

describe("theme registry", () => {
  it("offers Nitrate in place of Tokyo Night", () => {
    expect(listThemes().map((theme) => theme.id)).toEqual([
      "rose-pine",
      "null-log",
      "nitrate",
      "marquee",
    ]);
  });

  it("moves a stale Tokyo Night choice to Nitrate", () => {
    expect(resolveThemeId("tokyo-night")).toBe("nitrate");
  });

  it.each(["rose-pine", "null-log", "nitrate", "marquee"])(
    "%s text reaches 4.5:1 on its background and cards",
    (themeId) => {
      const tokens = listThemes().find((theme) => theme.id === themeId)!.tokens;
      const pairs: [string, string][] = [
        ["--foreground", "--background"],
        ["--foreground", "--card"],
        ["--muted-foreground", "--background"],
        ["--muted-foreground", "--card"],
        ["--primary-foreground", "--primary"],
      ];

      for (const [text, surface] of pairs) {
        expect(
          contrast(tokens[text]!, tokens[surface]!),
          `${themeId}: ${text} on ${surface}`,
        ).toBeGreaterThanOrEqual(4.5);
      }
    },
  );
});
