// Titles and descriptions for a page's <head>. These mirror the API's link-preview rules
// (apps/api/src/modules/public/helpers/share-meta-format.helper.ts), so a shared link reads
// the same to bots (served by the Pages Function) and to browsers.

const SHARE_DESCRIPTION_MAX_LENGTH = 160;
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

export type ShareText = { title: string; description: string };

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
}): ShareText => ({
  title: `${input.authorName}'s review of ${input.mediaTitle}`,
  description: input.containsSpoilers
    ? `Contains spoilers for ${input.mediaTitle}. Read on Interis.`
    : shareExcerpt(input.content),
});

export const profileShareText = (input: { username: string; displayName: string; bio: string | null }): ShareText => ({
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
}): ShareText => ({
  title: `${input.title} · a list by ${input.ownerName}`,
  description: input.description?.trim()
    ? shareExcerpt(input.description)
    : `${input.entryCount} ${input.entryCount === 1 ? "title" : "titles"} curated by ${input.ownerName} on Interis.`,
});

export const mediaShareText = (input: { title: string; year: number | null; overview: string | null }): ShareText => ({
  title: titleWithYear(input.title, input.year),
  description: input.overview?.trim() ? shareExcerpt(input.overview) : `${input.title} on Interis.`,
});

export const personShareText = (input: { name: string; role: "actor" | "director" }): ShareText => ({
  title: input.name,
  description:
    input.role === "actor"
      ? `Films and TV featuring ${input.name} on Interis.`
      : `Films and TV directed by ${input.name} on Interis.`,
});

// The API's generated 1200×630 card; `updatedAt` versions it like the API's own meta does.
export const shareCardUrl = (
  kind: "review" | "list" | "profile" | "movie" | "serial",
  id: string | number,
  updatedAt?: string,
): string => {
  const seconds = updatedAt ? Math.floor(Date.parse(updatedAt) / 1000) : Number.NaN;
  const version = Number.isFinite(seconds) ? `?v=${seconds.toString(36)}` : "";
  return `${API_BASE_URL}/api/public/og/${kind}/${encodeURIComponent(String(id))}.png${version}`;
};

// The head() meta entries for a shareable page.
export const shareHeadMeta = (text: ShareText, options: { image: string | null; ogType: string }) => [
  { title: `${text.title} — Interis` },
  { name: "description", content: text.description },
  { property: "og:title", content: text.title },
  { property: "og:description", content: text.description },
  { property: "og:type", content: options.ogType },
  { property: "og:image", content: options.image ?? "/og-image.png" },
  { name: "twitter:card", content: "summary_large_image" },
  { name: "twitter:title", content: text.title },
  { name: "twitter:description", content: text.description },
  { name: "twitter:image", content: options.image ?? "/og-image.png" },
];
