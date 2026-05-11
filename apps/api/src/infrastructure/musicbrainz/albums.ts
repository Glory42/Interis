import type { IReleaseGroup } from "musicbrainz-api";
import { mbApi, caaApi } from "./client";

export type { IReleaseGroup };

export type MBGenreTag = { name: string; count: number };

export const searchAlbums = async (query: string): Promise<IReleaseGroup[]> => {
  const result = await mbApi.search("release-group", {
    query,
    limit: 20,
  } as Parameters<typeof mbApi.search>[1]);
  return (result as { "release-groups": IReleaseGroup[] })["release-groups"] ?? [];
};

export const getReleaseGroupDetail = async (mbid: string): Promise<IReleaseGroup> => {
  return mbApi.lookup("release-group", mbid, ["artists", "releases", "tags", "ratings"]);
};

export const getCoverArtUrl = async (mbid: string): Promise<string | null> => {
  try {
    const info = await caaApi.getReleaseGroupCovers(mbid);
    if (!info?.images?.length) return null;
    const front = info.images.find((img) => img.front) ?? info.images[0];
    return front?.thumbnails?.["500"] ?? front?.thumbnails?.large ?? front?.image ?? null;
  } catch {
    return null;
  }
};

export const extractTopGenres = (rg: IReleaseGroup, maxCount = 5): MBGenreTag[] => {
  const tags = (rg.tags ?? []) as { name: string; count: number }[];
  const skipTags = new Set(["seen live", "soundcloud", "bandcamp", "free", "download"]);
  return tags
    .filter((t) => !skipTags.has(t.name.toLowerCase()))
    .sort((a, b) => b.count - a.count)
    .slice(0, maxCount)
    .map((t) => ({ name: t.name, count: t.count }));
};

export const buildArtistName = (rg: IReleaseGroup): string => {
  const credits = rg["artist-credit"] ?? [];
  return credits.map((c) => c.name + (c.joinphrase ?? "")).join("") || "Unknown Artist";
};

export const parseFirstReleaseYear = (rg: IReleaseGroup): number | null => {
  const raw = rg["first-release-date"];
  if (!raw) return null;
  const year = Number.parseInt(raw.slice(0, 4), 10);
  return Number.isNaN(year) ? null : year;
};
