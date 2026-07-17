import { z } from "zod";

export const SearchQuerySchema = z.object({
  query: z.string().trim().min(1),
});

export type SearchQuery = z.input<typeof SearchQuerySchema>;
