import { readFile } from "node:fs/promises";
import path from "node:path";
import type { SatoriOptions } from "satori";

type CardFont = SatoriOptions["fonts"][number];

const FONT_DIR = path.resolve(import.meta.dir, "../../../assets/fonts");

const FONT_FILES: { name: string; file: string; weight: CardFont["weight"] }[] = [
  { name: "Space Grotesk", file: "space-grotesk-latin-700-normal.woff", weight: 700 },
  { name: "Space Grotesk Ext", file: "space-grotesk-latin-ext-700-normal.woff", weight: 700 },
  { name: "Sora", file: "sora-latin-400-normal.woff", weight: 400 },
  { name: "Sora Ext", file: "sora-latin-ext-400-normal.woff", weight: 400 },
  { name: "JetBrains Mono", file: "jetbrains-mono-latin-700-normal.woff", weight: 700 },
  { name: "JetBrains Mono Ext", file: "jetbrains-mono-latin-ext-700-normal.woff", weight: 700 },
];

let fontsPromise: Promise<CardFont[]> | null = null;

// Read once per process; satori falls back across families for glyphs a subset lacks.
export const loadCardFonts = (): Promise<CardFont[]> => {
  fontsPromise ??= Promise.all(
    FONT_FILES.map(async ({ name, file, weight }) => ({
      name,
      weight,
      style: "normal" as const,
      data: await readFile(path.join(FONT_DIR, file)),
    })),
  ).catch((error: unknown) => {
    fontsPromise = null;
    throw error;
  });
  return fontsPromise;
};
