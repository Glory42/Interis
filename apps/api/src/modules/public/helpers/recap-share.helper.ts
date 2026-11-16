import { createHash } from "node:crypto";
import type { YearReview } from "../../year-review/types/year-review.types";

type RecapSummary = Pick<YearReview, "year" | "isPartialYear" | "depth" | "totals" | "topGenres" | "topDirectors" | "posterPaths">;

const plural = (count: number, one: string, many: string) => `${count.toLocaleString("en-US")} ${count === 1 ? one : many}`;

// Films always, Series and hours only when there are any; nothing for an empty year.
export const recapCardStats = (recap: RecapSummary) => {
  if (recap.depth === "empty") return [];
  const { films, series, hoursWatched } = recap.totals;
  return [
    { label: films === 1 ? "Film" : "Films", value: films },
    ...(series > 0 ? [{ label: "Series", value: series }] : []),
    ...(hoursWatched > 0 ? [{ label: hoursWatched === 1 ? "Hour" : "Hours", value: hoursWatched }] : []),
  ];
};

// The top director when there is one, else the top genre.
export const recapHighlight = (recap: RecapSummary) => {
  const director = recap.topDirectors[0];
  if (director) return { label: "Top director", value: director.director };
  const genre = recap.topGenres[0];
  return genre ? { label: "Top genre", value: genre.genre } : null;
};

// Changes whenever anything on the card does, so a fresh card gets past every cache.
export const recapVersion = (recap: RecapSummary): string =>
  createHash("sha1")
    .update(JSON.stringify([recapCardStats(recap), recapHighlight(recap), recap.posterPaths, recap.isPartialYear]))
    .digest("hex")
    .slice(0, 10);

// apps/web/src/lib/share-meta.ts (recapShareText) mirrors this.
export const recapShareText = (recap: RecapSummary & { user: { displayName: string } }) => {
  const name = recap.user.displayName;
  const title = recap.isPartialYear ? `${name}'s ${recap.year} so far` : `${name}'s ${recap.year} in review`;
  if (recap.depth === "empty") {
    return { title, description: `${name}'s year in film and TV on Interis.` };
  }

  const { films, series, hoursWatched } = recap.totals;
  const parts = [plural(films, "film", "films")];
  if (series > 0) parts.push(plural(series, "series", "series"));
  if (hoursWatched > 0) parts.push(plural(hoursWatched, "hour", "hours"));
  const counts = parts.length > 1 ? `${parts.slice(0, -1).join(", ")} and ${parts.at(-1)}` : parts[0];
  const highlight = recapHighlight(recap);
  return {
    title,
    description: `${counts} on Interis.${highlight ? ` ${highlight.label}: ${highlight.value}.` : ""}`,
  };
};
