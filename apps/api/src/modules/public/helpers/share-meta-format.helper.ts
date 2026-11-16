// Titles and descriptions for link previews. apps/web/src/lib/share-meta.ts mirrors these
// rules for the in-app <head>, so a shared link reads the same to bots and browsers.

export const SHARE_DESCRIPTION_MAX_LENGTH = 160;

export const displayNameOf = (person: { username: string; displayUsername: string | null }) =>
  person.displayUsername ?? person.username;

// Whitespace collapsed and cut at a word boundary, with an ellipsis when cut.
export const shareExcerpt = (text: string, maxLength = SHARE_DESCRIPTION_MAX_LENGTH): string => {
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length <= maxLength) return flat;
  const cut = flat.slice(0, maxLength - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > maxLength * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
};

export const titleWithYear = (title: string, year: number | null | undefined) =>
  year ? `${title} (${year})` : title;

export const seasonLabel = (seasonNumber: number) =>
  seasonNumber === 0 ? "Specials" : `Season ${seasonNumber}`;

export const reviewShareText = (input: {
  authorName: string;
  mediaTitle: string;
  content: string;
  containsSpoilers: boolean;
}) => ({
  title: `${input.authorName}'s review of ${input.mediaTitle}`,
  description: input.containsSpoilers
    ? `Contains spoilers for ${input.mediaTitle}. Read on Interis.`
    : shareExcerpt(input.content),
});

export const profileShareText = (input: { username: string; displayName: string; bio: string | null }) => ({
  title: `${input.displayName} (@${input.username})`,
  description: input.bio?.trim()
    ? shareExcerpt(input.bio)
    : `${input.displayName}'s movie and TV journal on Interis.`,
});

export const listShareText = (input: {
  title: string;
  ownerName: string;
  description: string | null;
  entryCount: number;
}) => ({
  title: `${input.title} · a list by ${input.ownerName}`,
  description: input.description?.trim()
    ? shareExcerpt(input.description)
    : `${input.entryCount} ${input.entryCount === 1 ? "title" : "titles"} curated by ${input.ownerName} on Interis.`,
});

export const mediaShareText = (input: { title: string; year: number | null; overview: string | null }) => ({
  title: titleWithYear(input.title, input.year),
  description: input.overview?.trim() ? shareExcerpt(input.overview) : `${input.title} on Interis.`,
});

export const personShareText = (input: { name: string; role: "actor" | "director" }) => ({
  title: input.name,
  description:
    input.role === "actor"
      ? `Films and TV featuring ${input.name} on Interis.`
      : `Films and TV directed by ${input.name} on Interis.`,
});
