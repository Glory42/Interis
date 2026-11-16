import { loadCardImageList, loadCardImages } from "../share-card-image.helper";
import { avatar, box, cardFrame, clampChars, kicker, poster, text } from "../share-card-elements";
import { CARD_COLORS, CARD_FONTS } from "../share-card-theme";
import { renderShareImage } from "../render-share-card";
import type { ShareCard } from "../share-card.types";

export type ProfileCardInput = {
  displayName: string;
  username: string;
  avatarUrl: string | null;
  bio: string | null;
  stats: { label: string; value: number }[];
  favoritePosterUrls: string[];
};

const FAVORITE = { width: 132, height: 198 };

const stat = (label: string, value: number) =>
  box(
    { flexDirection: "column", gap: 6 },
    text({ fontFamily: CARD_FONTS.display, fontSize: 40, color: CARD_COLORS.fg }, value.toLocaleString("en-US")),
    text({ fontFamily: CARD_FONTS.mono, fontSize: 15, letterSpacing: 2, color: CARD_COLORS.muted, textTransform: "uppercase" }, label),
  );

export const renderProfileCard = async (input: ProfileCardInput): Promise<ShareCard> => {
  const favoriteUrls = input.favoritePosterUrls.slice(0, 4);
  const [own, favorites] = await Promise.all([
    loadCardImages({ avatar: input.avatarUrl }),
    loadCardImageList(favoriteUrls),
  ]);

  const body = box(
    { width: "100%", gap: 56 },
    box(
      { flexDirection: "column", flexGrow: 1, flexShrink: 1, width: 0, gap: 22 },
      box(
        { alignItems: "center", gap: 28 },
        avatar(own.images.avatar, input.displayName, 124),
        box(
          { flexDirection: "column", gap: 8, flexShrink: 1 },
          text({ fontFamily: CARD_FONTS.display, fontSize: 52, lineHeight: 1.05, letterSpacing: -1, lineClamp: 1 }, clampChars(input.displayName, 30)),
          text({ fontFamily: CARD_FONTS.mono, fontSize: 22, color: CARD_COLORS.muted }, `@${input.username}`),
        ),
      ),
      input.bio
        ? text({ fontSize: 24, lineHeight: 1.45, color: CARD_COLORS.fg, lineClamp: 2 }, clampChars(input.bio, 160))
        : kicker("Film & TV journal", CARD_COLORS.primary),
      box({ gap: 44, marginTop: "auto" }, ...input.stats.map((entry) => stat(entry.label, entry.value))),
    ),
    favoriteUrls.length > 0 &&
      box(
        { flexDirection: "column", gap: 12, flexShrink: 0 },
        kicker("Favorites"),
        ...[0, 2].map((start) =>
          favoriteUrls.length > start &&
          box(
            { gap: 14 },
            ...favoriteUrls
              .slice(start, start + 2)
              .map((_, offset) => poster(favorites.images[start + offset] ?? null, FAVORITE.width, FAVORITE.height)),
          ),
        ),
      ),
  );

  const image = await renderShareImage(cardFrame({ kind: "Profile", accent: CARD_COLORS.primary, body }));
  return { image, complete: own.complete && favorites.complete };
};
