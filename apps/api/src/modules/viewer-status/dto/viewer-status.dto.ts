import { z } from "zod";

export const VIEWER_STATUS_MAX_ITEMS = 60;

const itemPattern = /^(movie|tv):([1-9]\d{0,9})$/;

// `items=movie:550,tv:1399` — up to 60 titles, duplicates dropped.
export const ViewerStatusQuerySchema = z.object({
  items: z
    .string()
    .trim()
    .min(1)
    .transform((raw) => raw.split(",").map((item) => item.trim()))
    .pipe(z.array(z.string().regex(itemPattern)).max(VIEWER_STATUS_MAX_ITEMS))
    .transform((items) =>
      [...new Set(items)].map((item) => {
        const [, mediaType, tmdbId] = itemPattern.exec(item)!;
        return { mediaType: mediaType as "movie" | "tv", tmdbId: Number(tmdbId) };
      }),
    ),
});

export type ViewerStatusItem = z.infer<typeof ViewerStatusQuerySchema>["items"][number];

export type ViewerStatus = ViewerStatusItem & {
  watched: boolean;
  rating: number | null;
  liked: boolean;
  watchlisted: boolean;
  episodes: { watched: number; total: number | null } | null;
};
