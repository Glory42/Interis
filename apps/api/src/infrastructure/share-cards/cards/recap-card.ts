import { loadCardImageList, loadCardImages } from "../share-card-image.helper";
import { avatar, box, cardFrame, clampChars, kicker, poster, text } from "../share-card-elements";
import { CARD_COLORS, CARD_FONTS } from "../share-card-theme";
import { renderShareImage } from "../render-share-card";
import type { ShareCard } from "../share-card.types";

export type RecapCardInput = {
  displayName: string;
  username: string;
  avatarUrl: string | null;
  year: number;
  // The current year reads as "so far".
  isPartialYear: boolean;
  // Headline numbers; empty for a year with no logs.
  stats: { label: string; value: number }[];
  // The top genre or director, e.g. { label: "Top director", value: "Agnès Varda" }.
  highlight: { label: string; value: string } | null;
  posterUrls: string[];
};

const POSTER = { width: 150, height: 225 };

const stat = (label: string, value: number) =>
  box(
    { flexDirection: "column", gap: 4 },
    text({ fontFamily: CARD_FONTS.display, fontSize: 76, lineHeight: 1, letterSpacing: -2, color: CARD_COLORS.fg }, value.toLocaleString("en-US")),
    text({ fontFamily: CARD_FONTS.mono, fontSize: 17, letterSpacing: 2.5, color: CARD_COLORS.muted, textTransform: "uppercase" }, label),
  );

export const renderRecapCard = async (input: RecapCardInput): Promise<ShareCard> => {
  const posterUrls = input.posterUrls.slice(0, 4);
  const [own, posters] = await Promise.all([loadCardImages({ avatar: input.avatarUrl }), loadCardImageList(posterUrls)]);
  const heading = input.isPartialYear ? `${input.year} so far` : `${input.year} in review`;

  const body = box(
    { width: "100%", gap: 56 },
    box(
      { flexDirection: "column", flexGrow: 1, flexShrink: 1, width: 0, gap: 26 },
      box(
        { alignItems: "center", gap: 20 },
        avatar(own.images.avatar, input.displayName, 64),
        box(
          { flexDirection: "column", gap: 4, flexShrink: 1 },
          text({ fontFamily: CARD_FONTS.display, fontSize: 30, lineHeight: 1.1, lineClamp: 1 }, clampChars(input.displayName, 30)),
          text({ fontFamily: CARD_FONTS.mono, fontSize: 18, color: CARD_COLORS.muted }, `@${input.username}`),
        ),
      ),
      text(
        { fontFamily: CARD_FONTS.display, fontSize: 64, lineHeight: 1, letterSpacing: -1.5, color: CARD_COLORS.primary },
        heading,
      ),
      input.stats.length > 0
        ? box({ gap: 48, marginTop: "auto" }, ...input.stats.map((entry) => stat(entry.label, entry.value)))
        : text({ fontSize: 26, lineHeight: 1.4, color: CARD_COLORS.muted, marginTop: "auto" }, "Nothing logged yet — the reel is still loading."),
      input.highlight &&
        box(
          { alignItems: "center", gap: 16 },
          kicker(input.highlight.label, CARD_COLORS.primary),
          text({ fontFamily: CARD_FONTS.display, fontSize: 28, lineClamp: 1 }, clampChars(input.highlight.value, 40)),
        ),
    ),
    posterUrls.length > 0 &&
      box(
        { flexDirection: "column", gap: 14, flexShrink: 0 },
        ...[0, 2].map((start) =>
          posterUrls.length > start &&
          box(
            { gap: 14 },
            ...posterUrls
              .slice(start, start + 2)
              .map((_, offset) => poster(posters.images[start + offset] ?? null, POSTER.width, POSTER.height)),
          ),
        ),
      ),
  );

  const image = await renderShareImage(cardFrame({ kind: "Year in review", accent: CARD_COLORS.primary, body }));
  return { image, complete: own.complete && posters.complete };
};
