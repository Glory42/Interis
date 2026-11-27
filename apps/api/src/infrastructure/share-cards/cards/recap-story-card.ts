import { loadCardImageList, loadCardImages } from "../share-card-image.helper";
import { avatar, box, clampChars, poster, text } from "../share-card-elements";
import { CARD_FONTS, STORY_CARD_HEIGHT, STORY_CARD_WIDTH } from "../share-card-theme";
import { renderShareImage } from "../render-share-card";
import type { ShareCard } from "../share-card.types";

export type RecapStoryCardInput = {
  displayName: string;
  username: string;
  year: number;
  isPartialYear: boolean;
  persona: {
    name: string;
    tagline: string;
    description: string;
    traits: string[];
  };
  totals: { films: number; series: number; episodes: number };
  avatarUrl: string | null;
  posterUrls: string[];
};

const STORY = {
  bg: "#050505",
  fg: "#f4efe4",
  muted: "#a39a8c",
  faint: "#6b645a",
  line: "rgba(244, 239, 228, 0.16)",
  lineStrong: "rgba(244, 239, 228, 0.28)",
  film: "#e8a33d",
} as const;

const POSTER = { width: 160, height: 240 };

const trait = (label: string) =>
  box(
    {
      padding: "10px 18px",
      border: `1px solid ${STORY.lineStrong}`,
      borderRadius: 2,
      fontFamily: CARD_FONTS.mono,
      fontSize: 20,
      letterSpacing: 2,
      textTransform: "uppercase",
      color: STORY.fg,
    },
    label,
  );

export const renderRecapStoryCard = async (input: RecapStoryCardInput): Promise<ShareCard> => {
  const posterUrls = input.posterUrls.slice(0, 4);
  const [own, posters] = await Promise.all([
    loadCardImages({ avatar: input.avatarUrl }),
    loadCardImageList(posterUrls),
  ]);

  const body = box(
    {
      width: STORY_CARD_WIDTH,
      height: STORY_CARD_HEIGHT,
      flexDirection: "column",
      padding: 72,
      backgroundColor: STORY.bg,
      color: STORY.fg,
      fontFamily: CARD_FONTS.body,
    },
    box(
      {
        width: "100%",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
      },
      text(
        { fontFamily: CARD_FONTS.mono, fontSize: 24, letterSpacing: 4, color: STORY.muted },
        "INTERIS",
      ),
      text(
        { fontFamily: CARD_FONTS.mono, fontSize: 24, letterSpacing: 4, color: STORY.muted },
        `${input.year} RECAP`,
      ),
    ),
    box(
      { flexDirection: "row", alignItems: "center", gap: 20, marginTop: 42 },
      avatar(own.images.avatar, input.displayName, 76),
      box(
        { flexDirection: "column", gap: 4 },
        text(
          { fontFamily: CARD_FONTS.display, fontSize: 34, lineHeight: 1.1, color: STORY.fg },
          clampChars(input.displayName, 28),
        ),
        text(
          { fontFamily: CARD_FONTS.mono, fontSize: 22, color: STORY.muted },
          `@${input.username}`,
        ),
      ),
    ),
    box(
      { flexDirection: "column", gap: 22, marginTop: 54 },
      text(
        { fontFamily: CARD_FONTS.mono, fontSize: 26, letterSpacing: 3, color: STORY.film },
        "THIS YEAR, YOU WERE",
      ),
      text(
        {
          fontFamily: CARD_FONTS.display,
          fontSize: 104,
          lineHeight: 0.92,
          letterSpacing: -3,
          color: STORY.fg,
        },
        clampChars(input.persona.name, 24),
      ),
      text(
        { fontFamily: CARD_FONTS.body, fontSize: 40, lineHeight: 1.25, color: STORY.fg },
        clampChars(input.persona.tagline, 90),
      ),
      text(
        { fontFamily: CARD_FONTS.body, fontSize: 28, lineHeight: 1.45, color: STORY.muted },
        clampChars(input.persona.description, 240),
      ),
    ),
    box(
      { flexDirection: "row", flexWrap: "wrap", gap: 14, marginTop: 36 },
      ...input.persona.traits.map(trait),
    ),
    box({ flexGrow: 1 }),
    posterUrls.length > 0
      ? box(
          { flexDirection: "row", gap: 18 },
          ...posters.images.map((image, index) =>
            poster(
              image ?? null,
              POSTER.width,
              POSTER.height,
              `Poster ${index + 1}`,
            ),
          ),
        )
      : null,
    box(
      {
        width: "100%",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-end",
        marginTop: 36,
        paddingTop: 24,
        borderTop: `1px solid ${STORY.line}`,
      },
      text(
        { fontFamily: CARD_FONTS.mono, fontSize: 20, color: STORY.faint },
        `BASED ON ${input.totals.films} FILMS · ${input.totals.series} SERIES · ${input.totals.episodes} EPISODES`,
      ),
      text(
        { fontFamily: CARD_FONTS.mono, fontSize: 20, color: STORY.faint },
        input.isPartialYear ? `${input.year} SO FAR` : `${input.year}`,
      ),
    ),
  );

  const image = await renderShareImage(body, {
    width: STORY_CARD_WIDTH,
    height: STORY_CARD_HEIGHT,
  });
  return { image, complete: own.complete && posters.complete };
};
