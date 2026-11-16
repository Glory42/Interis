import { loadCardImageList, loadCardImages } from "../share-card-image.helper";
import { avatar, box, cardFrame, clampChars, kicker, poster, text } from "../share-card-elements";
import { CARD_COLORS, CARD_FONTS } from "../share-card-theme";
import { renderShareImage } from "../render-share-card";
import type { ShareCard } from "../share-card.types";

export type ListCardInput = {
  title: string;
  isRanked: boolean;
  entryCount: number;
  posterUrls: string[];
  ownerName: string;
  ownerUsername: string;
  ownerAvatarUrl: string | null;
};

const STRIP_SIZE = 5;
const STRIP_POSTER = { width: 192, height: 288 };

export const renderListCard = async (input: ListCardInput): Promise<ShareCard> => {
  const urls = input.posterUrls.slice(0, STRIP_SIZE);
  const [strip, owner] = await Promise.all([
    loadCardImageList(urls),
    loadCardImages({ avatar: input.ownerAvatarUrl }),
  ]);
  const titles = `${input.entryCount} ${input.entryCount === 1 ? "title" : "titles"}`;

  const body = box(
    { flexDirection: "column", width: "100%", gap: 28 },
    box(
      { justifyContent: "space-between", alignItems: "flex-start", gap: 40 },
      box(
        { flexDirection: "column", gap: 16, flexShrink: 1 },
        kicker(`${input.isRanked ? "Ranked list" : "List"} · ${titles}`, CARD_COLORS.primary),
        text(
          { fontFamily: CARD_FONTS.display, fontSize: 52, lineHeight: 1.08, letterSpacing: -1, lineClamp: 2 },
          clampChars(input.title, 80),
        ),
      ),
      box(
        { alignItems: "center", gap: 14, flexShrink: 0, marginTop: 6 },
        avatar(owner.images.avatar, input.ownerName, 48),
        box(
          { flexDirection: "column", gap: 2 },
          text({ fontFamily: CARD_FONTS.display, fontSize: 22 }, clampChars(input.ownerName, 24)),
          text({ fontFamily: CARD_FONTS.mono, fontSize: 16, color: CARD_COLORS.muted }, `@${input.ownerUsername}`),
        ),
      ),
    ),
    box(
      { gap: 20, marginTop: "auto" },
      ...Array.from({ length: STRIP_SIZE }, (_, index) => {
        const src = strip.images[index] ?? null;
        const slot = index < urls.length
          ? poster(src, STRIP_POSTER.width, STRIP_POSTER.height)
          : box({ width: STRIP_POSTER.width, height: STRIP_POSTER.height, borderRadius: 3, border: `1px dashed ${CARD_COLORS.line}` });
        if (!input.isRanked || index >= urls.length) return slot;
        return box(
          { position: "relative" },
          slot,
          box(
            {
              position: "absolute",
              left: 10,
              top: 10,
              padding: "4px 10px",
              borderRadius: 3,
              backgroundColor: CARD_COLORS.slate,
              fontFamily: CARD_FONTS.mono,
              fontSize: 18,
              color: CARD_COLORS.fg,
            },
            String(index + 1),
          ),
        );
      }),
    ),
  );

  const image = await renderShareImage(cardFrame({ kind: "List", accent: CARD_COLORS.primary, body }));
  return { image, complete: strip.complete && owner.complete };
};
