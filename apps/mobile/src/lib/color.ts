// Small color helpers standing in for the web's `color-mix()` tokens, which
// React Native has no equivalent for.

const parseHex = (hex: string): [number, number, number] => {
  const normalized = hex.replace("#", "");
  const value = Number.parseInt(
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => char + char)
          .join("")
      : normalized,
    16,
  );

  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
};

const toHex = (channel: number): string =>
  Math.round(Math.max(0, Math.min(255, channel)))
    .toString(16)
    .padStart(2, "0");

export const withAlpha = (hex: string, alpha: number): string => {
  const [r, g, b] = parseHex(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// `mix("#000", "#fff", 0.3)` = 30% of the first color, 70% of the second.
export const mix = (first: string, second: string, firstWeight: number): string => {
  const a = parseHex(first);
  const b = parseHex(second);
  const weight = Math.max(0, Math.min(1, firstWeight));

  return `#${a.map((channel, index) => toHex(channel * weight + b[index] * (1 - weight))).join("")}`;
};
