import { loadCardImages } from "../share-card-image.helper";
import { box, cardFrame, clampChars, kicker, poster, rocketScore, text } from "../share-card-elements";
import { CARD_COLORS, CARD_FONTS } from "../share-card-theme";
import { renderSharePng } from "../render-share-card";
import type { ShareCard } from "../share-card.types";

export type MediaCardInput = {
  mediaKind: "film" | "series";
  title: string;
  year: number | null;
  // "Directed by …" for a Film, "Created by …" for a Series.
  credit: string | null;
  genres: string[];
  overview: string | null;
  communityRating: number | null;
  posterUrl: string | null;
  backdropUrl: string | null;
};

export const renderMediaCard = async (input: MediaCardInput): Promise<ShareCard> => {
  const { images, complete } = await loadCardImages({ poster: input.posterUrl, backdrop: input.backdropUrl });
  const accent = input.mediaKind === "film" ? CARD_COLORS.film : CARD_COLORS.series;
  const meta = [input.credit, input.genres.slice(0, 3).join(" · ")].filter(Boolean).join("  ·  ");

  const body = box(
    { gap: 56, width: "100%" },
    poster(images.poster, 300, 450, input.title),
    box(
      { flexDirection: "column", flexGrow: 1, flexShrink: 1, width: 0, gap: 20 },
      kicker(`${input.mediaKind === "film" ? "Film" : "TV"}${input.year ? ` · ${input.year}` : ""}`, accent),
      text(
        { fontFamily: CARD_FONTS.display, fontSize: 60, lineHeight: 1.05, letterSpacing: -1.2, lineClamp: 2 },
        clampChars(input.title, 70),
      ),
      meta && text({ fontFamily: CARD_FONTS.mono, fontSize: 19, color: CARD_COLORS.muted, lineClamp: 1 }, clampChars(meta, 80)),
      input.overview &&
        text({ fontSize: 23, lineHeight: 1.45, color: CARD_COLORS.fg, lineClamp: 3 }, clampChars(input.overview, 240)),
      input.communityRating !== null &&
        box(
          { flexDirection: "column", gap: 10, marginTop: "auto" },
          kicker("Community rating"),
          rocketScore(Math.round(input.communityRating * 10) / 10, 28),
        ),
    ),
  );

  const png = await renderSharePng(cardFrame({ kind: input.mediaKind === "film" ? "Film" : "TV", accent, backdrop: images.backdrop, body }));
  return { png, complete };
};
