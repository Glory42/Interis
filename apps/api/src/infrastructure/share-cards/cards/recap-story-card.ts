import { loadCardImageList, loadCardImages } from "../share-card-image.helper";
import { box, clampChars, h, text } from "../share-card-elements";
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
  totals: { films: number; series: number; episodes: number; hours: number };
  avatarUrl: string | null;
  backdropUrl?: string | null;
  topFilmTitle?: string | null;
  posterUrls: string[];
};

const STORY = {
  bg: "#080706",
  surface: "#12100e",
  fg: "#f4efe4",
  muted: "#a39a8c",
  faint: "#6b645a",
  line: "rgba(244, 239, 228, 0.16)",
  lineStrong: "rgba(244, 239, 228, 0.28)",
  film: "#e8a33d",
  primary: "#f2c46d",
} as const;

const WALL = { columns: 4, width: 220, height: 330, gap: 16 };
const CARD_PADDING = 72;

const storyAvatar = (src: string | null, name: string, size: number) =>
  src
    ? h("img", {
        src,
        width: size,
        height: size,
        style: { width: size, height: size, borderRadius: size, objectFit: "cover" },
      })
    : box(
        {
          width: size,
          height: size,
          borderRadius: size,
          backgroundColor: STORY.surface,
          border: `2px solid ${STORY.lineStrong}`,
          alignItems: "center",
          justifyContent: "center",
        },
        text(
          { fontFamily: CARD_FONTS.display, fontSize: size * 0.45, color: STORY.primary },
          (name.trim()[0] ?? "?").toUpperCase(),
        ),
      );

const storyPoster = (src: string | null, index: number) =>
  src
    ? h("img", {
        src,
        width: WALL.width,
        height: WALL.height,
        style: {
          width: WALL.width,
          height: WALL.height,
          objectFit: "cover",
          borderRadius: 2,
          border: `1px solid ${STORY.line}`,
        },
      })
    : box(
        {
          width: WALL.width,
          height: WALL.height,
          borderRadius: 2,
          border: `1px solid ${STORY.lineStrong}`,
          backgroundColor: STORY.surface,
          alignItems: "center",
          justifyContent: "center",
        },
        text(
          { fontFamily: CARD_FONTS.mono, fontSize: 18, letterSpacing: 2, color: STORY.faint },
          `FILM ${String(index + 1).padStart(2, "0")}`,
        ),
      );

const trait = (label: string) =>
  box(
    {
      padding: "10px 18px",
      border: `1px solid ${STORY.lineStrong}`,
      borderRadius: 2,
      backgroundColor: "rgba(8, 7, 6, 0.55)",
      fontFamily: CARD_FONTS.mono,
      fontSize: 20,
      letterSpacing: 2,
      textTransform: "uppercase",
      color: STORY.fg,
    },
    label,
  );

const stat = (label: string, value: string, divider: boolean) =>
  box(
    {
      flex: 1,
      flexDirection: "column",
      gap: 6,
      paddingLeft: divider ? 24 : 0,
      borderLeft: divider ? `1px solid ${STORY.line}` : "none",
    },
    text(
      { fontFamily: CARD_FONTS.display, fontSize: 50, lineHeight: 1, letterSpacing: -2, color: STORY.fg },
      value,
    ),
    text(
      { fontFamily: CARD_FONTS.mono, fontSize: 18, letterSpacing: 2, color: STORY.muted },
      label,
    ),
  );

export const renderRecapStoryCard = async (input: RecapStoryCardInput): Promise<ShareCard> => {
  const posterUrls = input.posterUrls.slice(0, WALL.columns * 2);
  const [own, posters] = await Promise.all([
    loadCardImages({ avatar: input.avatarUrl, backdrop: input.backdropUrl ?? null }),
    loadCardImageList(posterUrls),
  ]);

  const body = box(
    {
      width: STORY_CARD_WIDTH,
      height: STORY_CARD_HEIGHT,
      position: "relative",
      flexDirection: "column",
      backgroundColor: STORY.bg,
      color: STORY.fg,
      fontFamily: CARD_FONTS.body,
      overflow: "hidden",
    },
    own.images.backdrop &&
      h("img", {
        src: own.images.backdrop,
        width: STORY_CARD_WIDTH,
        height: STORY_CARD_HEIGHT,
        style: {
          position: "absolute",
          left: 0,
          top: 0,
          width: STORY_CARD_WIDTH,
          height: STORY_CARD_HEIGHT,
          objectFit: "cover",
          opacity: 0.5,
        },
      }),
    box({
      position: "absolute",
      left: 0,
      top: 0,
      width: STORY_CARD_WIDTH,
      height: STORY_CARD_HEIGHT,
      backgroundImage:
        "linear-gradient(180deg, rgba(8,7,6,0.5) 0%, rgba(8,7,6,0.62) 34%, rgba(8,7,6,0.92) 68%, #080706 100%)",
    }),
    box(
      {
        position: "relative",
        width: "100%",
        height: "100%",
        flexDirection: "column",
        padding: CARD_PADDING,
        boxSizing: "border-box",
      },
      box(
        { width: "100%", flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
        text(
          { fontFamily: CARD_FONTS.mono, fontSize: 24, letterSpacing: 5, color: STORY.fg },
          "INTERIS",
        ),
        text(
          { fontFamily: CARD_FONTS.mono, fontSize: 22, letterSpacing: 4, color: STORY.muted },
          `${input.year} RECAP`,
        ),
      ),
      box(
        { width: "100%", flexDirection: "row", alignItems: "center", gap: 20, marginTop: 34 },
        storyAvatar(own.images.avatar, input.displayName, 76),
        box(
          { flexDirection: "column", gap: 4, minWidth: 0 },
          text(
            {
              fontFamily: CARD_FONTS.display,
              fontSize: 34,
              lineHeight: 1.1,
              color: STORY.fg,
              width: "100%",
            },
            clampChars(input.displayName, 28),
          ),
          text(
            { fontFamily: CARD_FONTS.mono, fontSize: 22, color: STORY.muted },
            `@${input.username}`,
          ),
        ),
      ),
      box(
        { width: "100%", flexDirection: "column", gap: 0, marginTop: 56 },
        text(
          { fontFamily: CARD_FONTS.mono, fontSize: 26, letterSpacing: 4, color: STORY.film },
          "THIS YEAR, YOU WERE",
        ),
        text(
          {
            width: "100%",
            marginTop: 18,
            fontFamily: CARD_FONTS.display,
            fontSize: 108,
            lineHeight: 0.9,
            letterSpacing: -4,
            textTransform: "uppercase",
            color: STORY.fg,
          },
          clampChars(input.persona.name, 28),
        ),
        text(
          {
            width: "100%",
            marginTop: 24,
            fontFamily: CARD_FONTS.body,
            fontSize: 40,
            lineHeight: 1.2,
            color: STORY.fg,
          },
          clampChars(input.persona.tagline, 100),
        ),
        text(
          {
            width: "100%",
            marginTop: 18,
            fontFamily: CARD_FONTS.body,
            fontSize: 28,
            lineHeight: 1.5,
            color: STORY.muted,
          },
          clampChars(input.persona.description, 260),
        ),
      ),
      box(
        { width: "100%", flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 30 },
        ...input.persona.traits.slice(0, 5).map(trait),
      ),
      posterUrls.length > 0
        ? box(
            { width: "100%", flexDirection: "column", marginTop: 34 },
            text(
              { fontFamily: CARD_FONTS.mono, fontSize: 20, letterSpacing: 4, color: STORY.film },
              "THE YEAR IN FRAMES",
            ),
            box(
              {
                width: "100%",
                flexDirection: "row",
                flexWrap: "wrap",
                gap: WALL.gap,
                marginTop: 14,
              },
              ...posters.images.map((image, index) => storyPoster(image, index)),
            ),
          )
        : null,
      input.topFilmTitle
        ? box(
            { width: "100%", flexDirection: "column", gap: 6, marginTop: 34 },
            text(
              { fontFamily: CARD_FONTS.mono, fontSize: 18, letterSpacing: 4, color: STORY.film },
              "FILM OF THE YEAR",
            ),
            text(
              {
                width: "100%",
                fontFamily: CARD_FONTS.display,
                fontSize: 42,
                lineHeight: 1.05,
                color: STORY.fg,
              },
              clampChars(input.topFilmTitle, 54),
            ),
          )
        : null,
      box({ flexGrow: 1 }),
      box(
        {
          width: "100%",
          flexDirection: "row",
          marginTop: 28,
          paddingTop: 24,
          borderTop: `1px solid ${STORY.line}`,
        },
        stat("FILMS", input.totals.films.toLocaleString("en-US"), false),
        stat("SERIES", input.totals.series.toLocaleString("en-US"), true),
        stat("EPISODES", input.totals.episodes.toLocaleString("en-US"), true),
        stat("HOURS", input.totals.hours.toLocaleString("en-US"), true),
      ),
      box(
        {
          width: "100%",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginTop: 30,
          paddingTop: 20,
          borderTop: `1px solid ${STORY.line}`,
        },
        text(
          { fontFamily: CARD_FONTS.mono, fontSize: 18, letterSpacing: 2, color: STORY.faint },
          input.isPartialYear ? `${input.year} SO FAR` : "A YEAR IN THE DARK",
        ),
        text(
          { fontFamily: CARD_FONTS.mono, fontSize: 18, letterSpacing: 2, color: STORY.faint },
          `@${input.username}`,
        ),
      ),
    ),
  );

  const image = await renderShareImage(body, {
    width: STORY_CARD_WIDTH,
    height: STORY_CARD_HEIGHT,
  });
  return {
    image,
    complete: own.complete && posters.complete,
  };
};
