import type { UserTopPickCategory } from "@/features/profile/api";
import type { MediaType } from "@/types/api";

export type TopPickSlot = {
  slot: number;
  mediaType: MediaType;
  mediaSource: "tmdb" | "musicbrainz" | "googlebooks";
  mediaSourceId: string;
  tmdbId?: number;
  mbid?: string;
  volumeId?: string;
  title: string;
  posterPath: string | null;
  coverArtUrl?: string | null;
  releaseYear: number | null;
  artistName?: string | null;
  authors?: string[] | null;
};

export type TopPickCategoryKey = "cinema" | "serial" | "music" | "books";

export type PickerTarget = {
  category: TopPickCategoryKey;
  slotIndex: number;
};

export const toFixedLengthSlots = (
  items: Array<TopPickSlot | null>,
): Array<TopPickSlot | null> => [
  items[0] ?? null,
  items[1] ?? null,
  items[2] ?? null,
  items[3] ?? null,
];

export const asTopPickSlot = (slot: TopPickSlot | null): slot is TopPickSlot =>
  slot !== null;

export const resolveCategorySlots = (
  category: UserTopPickCategory | undefined,
  mediaType: MediaType,
): Array<TopPickSlot | null> => {
  if (!category) {
    return [null, null, null, null];
  }

  const slots = [null, null, null, null] as Array<TopPickSlot | null>;

  for (const item of category.items) {
    if (item.mediaType !== mediaType) continue;

    const zeroIndexedSlot = item.slot - 1;
    if (zeroIndexedSlot < 0 || zeroIndexedSlot > 3) continue;

    if (!item.title) continue;

    if (mediaType === "movie" || mediaType === "tv") {
      const resolvedTmdbId =
        item.tmdbId ??
        (item.mediaSource === "tmdb" ? Number(item.mediaSourceId) : Number.NaN);
      if (!Number.isInteger(resolvedTmdbId)) continue;
      slots[zeroIndexedSlot] = {
        slot: item.slot,
        mediaType,
        mediaSource: "tmdb",
        mediaSourceId: String(resolvedTmdbId),
        tmdbId: resolvedTmdbId,
        title: item.title,
        posterPath: item.posterPath ?? null,
        releaseYear: item.releaseYear ?? null,
      };
    } else if (mediaType === "album") {
      slots[zeroIndexedSlot] = {
        slot: item.slot,
        mediaType: "album",
        mediaSource: "musicbrainz",
        mediaSourceId: item.mediaSourceId,
        mbid: item.mediaSourceId,
        title: item.title,
        posterPath: null,
        coverArtUrl: item.coverArtUrl ?? null,
        releaseYear: item.releaseYear ?? null,
        artistName: item.artistName ?? null,
      };
    } else if (mediaType === "book") {
      slots[zeroIndexedSlot] = {
        slot: item.slot,
        mediaType: "book",
        mediaSource: "googlebooks",
        mediaSourceId: item.mediaSourceId,
        volumeId: item.mediaSourceId,
        title: item.title,
        posterPath: null,
        coverArtUrl: item.coverArtUrl ?? null,
        releaseYear: item.releaseYear ?? null,
        authors: item.authors ?? null,
      };
    }
  }

  return toFixedLengthSlots(slots);
};

export const buildTopPickPayload = (
  categoryId: 1 | 2 | 3 | 4,
  slots: Array<TopPickSlot | null>,
) => {
  return {
    categoryId,
    items: slots
      .map((slot, index) => {
        if (!slot) return null;
        return {
          slot: index + 1,
          mediaType: slot.mediaType,
          mediaSource: slot.mediaSource,
          mediaSourceId: slot.mediaSourceId,
          title: slot.title,
          posterPath: slot.posterPath,
          coverArtUrl: slot.coverArtUrl,
          releaseYear: slot.releaseYear,
          artistName: slot.artistName,
          authors: slot.authors,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null),
  };
};
