export const TOP_PICK_CATEGORY_IDS = [1, 2] as const;

export type TopPickCategoryId = (typeof TOP_PICK_CATEGORY_IDS)[number];

export const TOP_PICK_CATEGORY_KEYS = {
  1: "cinema",
  2: "serial",
} as const;

export type TopPickCategoryKey =
  (typeof TOP_PICK_CATEGORY_KEYS)[TopPickCategoryId];

export const TOP_PICK_MEDIA_TYPES = ["movie", "tv"] as const;

export type TopPickMediaType = (typeof TOP_PICK_MEDIA_TYPES)[number];

export const TOP_PICK_DEFAULT_MEDIA_TYPE: Record<
  TopPickCategoryId,
  TopPickMediaType
> = {
  1: "movie",
  2: "tv",
};

export const TOP_PICK_SUPPORTED_CATEGORY_IDS: TopPickCategoryId[] = [1, 2];

export const MAX_TOP_PICK_ITEMS_PER_CATEGORY = 4;

export const TOP_PICK_CATEGORY_ID_SET = new Set<number>(TOP_PICK_CATEGORY_IDS);
export const TOP_PICK_MEDIA_TYPE_SET = new Set<string>(TOP_PICK_MEDIA_TYPES);
export const TOP_PICK_SUPPORTED_CATEGORY_ID_SET = new Set<number>(
  TOP_PICK_SUPPORTED_CATEGORY_IDS,
);
