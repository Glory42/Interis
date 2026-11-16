import { CARD_COLORS, CARD_FONTS, CARD_HEIGHT, CARD_WIDTH } from "./share-card-theme";

export type CardStyle = Record<string, string | number>;
export type CardNode = { type: string; key: null; props: Record<string, unknown> };
type CardChild = CardNode | string | null | false | undefined;

// A satori element without JSX: the same { type, props } shape React would build.
export const h = (
  type: string,
  props: Record<string, unknown> & { style?: CardStyle },
  ...children: CardChild[]
): CardNode => {
  const kept = children.filter((child): child is CardNode | string => Boolean(child));
  return { type, key: null, props: { ...props, children: kept.length === 1 ? kept[0] : kept } };
};

export const box = (style: CardStyle, ...children: CardChild[]) =>
  h("div", { style: { display: "flex", ...style } }, ...children);

export const text = (style: CardStyle, content: string) => h("div", { style: { display: "block", ...style } }, content);

export const clampChars = (value: string, max: number): string => {
  const flat = value.replace(/\s+/g, " ").trim();
  return flat.length <= max ? flat : `${flat.slice(0, max - 1).trimEnd()}…`;
};

export const kicker = (label: string, color: string = CARD_COLORS.muted) =>
  text(
    { fontFamily: CARD_FONTS.mono, fontSize: 20, letterSpacing: 3.5, textTransform: "uppercase", color },
    label,
  );

// lucide's Rocket, the glyph RocketDisplay uses in the app.
const ROCKET_PATHS = [
  "M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5",
  "M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09",
  "M9 12a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.4 22.4 0 0 1-4 2z",
  "M9 12H4s.55-3.03 2-4c1.62-1.08 5 .05 5 .05",
];

export const rocketIcon = (size: number, color: string, filled: boolean) =>
  h(
    "svg",
    {
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: filled ? color : "none",
      stroke: color,
      strokeWidth: 2,
      strokeLinecap: "round",
      strokeLinejoin: "round",
    },
    ...ROCKET_PATHS.map((d) => h("path", { d })),
  );

// Ten rockets filled to the 0.5–10 score, like RocketDisplay's row variant, plus the number.
export const rocketScore = (rating: number, size = 30, color: string = CARD_COLORS.primary) =>
  box(
    { alignItems: "center", gap: 18 },
    box(
      { gap: 5 },
      ...Array.from({ length: 10 }, (_, index) => {
        const fill = Math.max(0, Math.min(1, rating - index));
        return box(
          { position: "relative", width: size, height: size },
          rocketIcon(size, CARD_COLORS.lineStrong, false),
          fill > 0 &&
            box(
              { position: "absolute", left: 0, top: 0, width: size * fill, height: size, overflow: "hidden" },
              rocketIcon(size, color, true),
            ),
        );
      }),
    ),
    text({ fontFamily: CARD_FONTS.mono, fontSize: size * 1.05, color }, rating.toFixed(1)),
  );

export const poster = (src: string | null, width: number, height: number, label = "") =>
  src
    ? h("img", {
        src,
        width,
        height,
        style: { width, height, objectFit: "cover", borderRadius: 3, border: `1px solid ${CARD_COLORS.line}` },
      })
    : box(
        {
          width,
          height,
          borderRadius: 3,
          border: `1px solid ${CARD_COLORS.lineStrong}`,
          backgroundColor: CARD_COLORS.raised,
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
        },
        text(
          { fontFamily: CARD_FONTS.display, fontSize: Math.round(width / 7), color: CARD_COLORS.faint, textAlign: "center" },
          clampChars(label, 40),
        ),
      );

export const avatar = (src: string | null, name: string, size: number) =>
  src
    ? h("img", { src, width: size, height: size, style: { width: size, height: size, borderRadius: size, objectFit: "cover" } })
    : box(
        {
          width: size,
          height: size,
          borderRadius: size,
          backgroundColor: CARD_COLORS.raised,
          border: `2px solid ${CARD_COLORS.lineStrong}`,
          alignItems: "center",
          justifyContent: "center",
        },
        text({ fontFamily: CARD_FONTS.display, fontSize: size * 0.45, color: CARD_COLORS.primary }, (name.trim()[0] ?? "?").toUpperCase()),
      );

// The black slate across the top (as on the app's cards), the optional darkened backdrop,
// and the content area below it.
export const cardFrame = (input: { kind: string; accent: string; backdrop?: string | null; body: CardNode }) =>
  box(
    {
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      position: "relative",
      flexDirection: "column",
      backgroundColor: CARD_COLORS.bg,
      color: CARD_COLORS.fg,
      fontFamily: CARD_FONTS.body,
    },
    input.backdrop &&
      h("img", {
        src: input.backdrop,
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        style: { position: "absolute", left: 0, top: 0, width: CARD_WIDTH, height: CARD_HEIGHT, objectFit: "cover" },
      }),
    input.backdrop &&
      box({
        position: "absolute",
        left: 0,
        top: 0,
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        backgroundImage: "linear-gradient(90deg, rgba(25,23,36,0.97) 0%, rgba(25,23,36,0.9) 45%, rgba(25,23,36,0.72) 100%)",
      }),
    box(
      {
        position: "relative",
        height: 52,
        flexShrink: 0,
        backgroundColor: CARD_COLORS.slate,
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 48px",
        fontFamily: CARD_FONTS.mono,
        fontSize: 18,
        letterSpacing: 3,
        color: CARD_COLORS.slateText,
      },
      box({ alignItems: "center", gap: 12 }, rocketIcon(22, CARD_COLORS.primary, true), text({ color: CARD_COLORS.fg }, "INTERIS")),
      text({ color: input.accent }, input.kind.toUpperCase()),
    ),
    box({ flexGrow: 1, position: "relative", padding: "40px 64px 48px" }, input.body),
  );
