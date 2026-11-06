import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { listThemes, resolveThemeId } from "@/features/theme/theme-registry";
import { applyThemeToDom } from "@/features/theme/theme-runtime";

const THEME_IDS = ["rose-pine", "null-log", "nitrate", "marquee"] as const;

// Loads the same registry script index.html runs before React.
beforeAll(() => {
  const source = readFileSync(resolve(__dirname, "../../../../public/theme-registry.js"), "utf8");
  new Function("window", source)(window);
});

// Theme colours live only in index.css: `:root` is Rose Pine, the rest are
// `:root[data-theme-id="…"]` blocks.
const readThemeTokens = (): Record<string, Record<string, string>> => {
  const css = readFileSync(resolve(__dirname, "../../../../src/index.css"), "utf8");
  const blocks: Record<string, Record<string, string>> = {};
  for (const match of css.matchAll(/^:root(?:\[data-theme-id="([a-z-]+)"\])? \{([\s\S]*?)^\}/gm)) {
    const tokens: Record<string, string> = {};
    for (const token of match[2]!.matchAll(/^\s*(--[a-z0-9-]+):\s*([^;]+);/gm)) {
      tokens[token[1]!] = token[2]!.trim();
    }
    blocks[match[1] ?? "rose-pine"] = tokens;
  }
  return blocks;
};

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
    expect(listThemes().map((theme) => theme.id)).toEqual([...THEME_IDS]);
  });

  it("moves a stale Tokyo Night choice to Nitrate", () => {
    expect(resolveThemeId("tokyo-night")).toBe("nitrate");
  });

  it("keeps colours out of the registry script", () => {
    for (const theme of listThemes()) {
      expect(theme, theme.id).not.toHaveProperty("tokens");
    }
  });

  it("applies a theme by id alone, with no inline colours", () => {
    applyThemeToDom("nitrate");

    expect(document.documentElement.dataset.themeId).toBe("nitrate");
    expect(document.documentElement.getAttribute("style") ?? "").toBe("");
  });

  it.each(THEME_IDS)("%s text roles reach 4.5:1 on bg and surface", (themeId) => {
    const tokens = readThemeTokens()[themeId]!;
    const textRoles = ["--fg", "--muted-foreground", "--primary", "--film", "--series", "--like", "--danger", "--warning", "--success"];

    for (const surface of ["--bg", "--surface"]) {
      for (const role of textRoles) {
        expect(tokens[role], `${themeId} defines ${role}`).toMatch(/^#[0-9a-f]{6}$/);
        expect(contrast(tokens[role]!, tokens[surface]!), `${themeId}: ${role} on ${surface}`)
          .toBeGreaterThanOrEqual(4.5);
      }
    }
    expect(contrast(tokens["--primary-foreground"]!, tokens["--primary"]!)).toBeGreaterThanOrEqual(4.5);
  });
});
