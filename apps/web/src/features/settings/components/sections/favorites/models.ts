import type { UserTopPickCategory } from "@/features/profile/api";

export type TopPickSlot = {
  slot: number;
  mediaType: "movie" | "tv";
  mediaSource: "tmdb";
  mediaSourceId: string;
  tmdbId: number;
  title: string;
  posterPath: string | null;
  releaseYear: number | null;
};

export type TopPickCategoryKey = "cinema" | "serial";

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
  mediaType: "movie" | "tv",
): Array<TopPickSlot | null> => {
  if (!category) {
    return [null, null, null, null];
  }

  const slots = [null, null, null, null] as Array<TopPickSlot | null>;

  for (const item of category.items) {
    if (item.mediaType !== mediaType) {
      continue;
    }

    const zeroIndexedSlot = item.slot - 1;
    if (zeroIndexedSlot < 0 || zeroIndexedSlot > 3) {
      continue;
    }

    const resolvedTmdbId =
      item.tmdbId ??
      (item.mediaSource === "tmdb" ? Number(item.mediaSourceId) : Number.NaN);

    if (!Number.isInteger(resolvedTmdbId) || !item.title) {
      continue;
    }

    slots[zeroIndexedSlot] = {
      slot: item.slot,
      mediaType,
      mediaSource: "tmdb",
      mediaSourceId: String(resolvedTmdbId),
      tmdbId: resolvedTmdbId,
      title: item.title,
      posterPath: item.posterPath,
      releaseYear: item.releaseYear,
    };
  }

  return toFixedLengthSlots(slots);
};

export const buildTopPickPayload = (
  categoryId: 1 | 2,
  slots: Array<TopPickSlot | null>,
) => {
  return {
    categoryId,
    items: slots
      .map((slot, index) => {
        if (!slot) {
          return null;
        }

        return {
          slot: index + 1,
          mediaType: slot.mediaType,
          mediaSource: slot.mediaSource,
          mediaSourceId: slot.mediaSourceId,
          title: slot.title,
          posterPath: slot.posterPath,
          releaseYear: slot.releaseYear,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null),
  };
};
