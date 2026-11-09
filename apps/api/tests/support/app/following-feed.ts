import { expect } from "bun:test";
import { apiRequest } from "./http-client";
import type { CookieJar } from "./cookie-jar";

type Actor = { id: string; username: string };
type Title = { tmdbId: number; title: string; mediaType: string };

export type FeedItemJson = {
  id: string;
  type: string;
  kind: string;
  actor: Actor;
  movie: Title | null;
  metadata: Record<string, unknown> & { targetUsername: string | null; excerpt: string | null };
};

export type TitleGroupJson = {
  kind: "title";
  id: string;
  actor: Actor;
  movie: Title;
  seasonNumber: number | null;
  episodeNumber: number | null;
  watched: boolean;
  rating: number | null;
  liked: boolean;
  watchlisted: boolean;
  review: { id: string; content: string } | null;
  log: { id: string; watchedDate: string; rating: number | null; rewatch: boolean } | null;
  itemIds: string[];
};

// One row of the Grouped Following Feed or profile overview, as the viewer sees it.
export type FeedRowJson = { key: string; day: string } & (
  | { kind: "title"; group: TitleGroupJson }
  | { kind: "activity"; item: FeedItemJson }
  | { kind: "titles"; action: "liked" | "watchlisted"; actor: Actor; titles: Title[] }
  | { kind: "follows"; actor: Actor; usernames: string[] }
  | { kind: "episodes"; actor: Actor; movie: Title; groups: TitleGroupJson[] }
);

export type FeedPageJson = { rows: FeedRowJson[]; nextCursor: string | null };

export const readFollowingFeed = async (baseUrl: string, jar: CookieJar, query = ""): Promise<FeedPageJson> => {
  const response = await apiRequest(baseUrl, `/api/social/feed/grouped${query ? `?${query}` : ""}`, {}, jar);
  expect(response.status).toBe(200);
  return (await response.json()) as FeedPageJson;
};

// The rows that show one plain activity (posts, comments, lists, a lone follow…).
export const activityItems = (rows: FeedRowJson[]): FeedItemJson[] =>
  rows.flatMap((row) => (row.kind === "activity" ? [row.item] : []));

// Every title card, including each season or episode inside a folded run.
export const titleGroups = (rows: FeedRowJson[]): TitleGroupJson[] =>
  rows.flatMap((row) => (row.kind === "title" ? [row.group] : row.kind === "episodes" ? row.groups : []));
