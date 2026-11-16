import { loadCardImages } from "../share-card-image.helper";
import type { ShareCard } from "../share-card.types";
import { avatar, box, cardFrame, clampChars, kicker, poster, rocketScore, text } from "../share-card-elements";
import { CARD_COLORS, CARD_FONTS } from "../share-card-theme";
import { renderSharePng } from "../render-share-card";

export type ReviewCardInput = {
  mediaKind: "film" | "series";
  mediaTitle: string;
  year: number | null;
  posterUrl: string | null;
  backdropUrl: string | null;
  rating: number | null;
  content: string;
  containsSpoilers: boolean;
  authorName: string;
  authorUsername: string;
  authorAvatarUrl: string | null;
};

export const renderReviewCard = async (input: ReviewCardInput): Promise<ShareCard> => {
  const { images, complete } = await loadCardImages({
    poster: input.posterUrl,
    backdrop: input.backdropUrl,
    avatar: input.authorAvatarUrl,
  });
  const accent = input.mediaKind === "film" ? CARD_COLORS.film : CARD_COLORS.series;

  const body = box(
    { gap: 56, width: "100%" },
    poster(images.poster, 300, 450, input.mediaTitle),
    box(
      { flexDirection: "column", flexGrow: 1, flexShrink: 1, width: 0, gap: 22 },
      kicker(`Review · ${input.mediaKind === "film" ? "Film" : "TV"}${input.year ? ` · ${input.year}` : ""}`, accent),
      text(
        { fontFamily: CARD_FONTS.display, fontSize: 54, lineHeight: 1.08, letterSpacing: -1, lineClamp: 2 },
        clampChars(input.mediaTitle, 70),
      ),
      input.rating !== null && rocketScore(input.rating),
      input.containsSpoilers
        ? text({ fontFamily: CARD_FONTS.mono, fontSize: 22, letterSpacing: 2, color: CARD_COLORS.muted }, "CONTAINS SPOILERS")
        : text(
            { fontSize: 25, lineHeight: 1.45, color: CARD_COLORS.fg, lineClamp: input.rating === null ? 5 : 3 },
            `“${clampChars(input.content, 260)}”`,
          ),
      box(
        { marginTop: "auto", alignItems: "center", gap: 18 },
        avatar(images.avatar, input.authorName, 56),
        box(
          { flexDirection: "column", gap: 4 },
          text({ fontFamily: CARD_FONTS.display, fontSize: 26 }, clampChars(input.authorName, 40)),
          text({ fontFamily: CARD_FONTS.mono, fontSize: 18, color: CARD_COLORS.muted }, `@${input.authorUsername}`),
        ),
      ),
    ),
  );

  const png = await renderSharePng(cardFrame({ kind: "Review", accent, backdrop: images.backdrop, body }));
  return { png, complete };
};
