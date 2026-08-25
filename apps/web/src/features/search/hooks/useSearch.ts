import { useQuery } from "@tanstack/react-query";
import { searchTitles } from "@/features/search/api";

export const searchKeys = {
  titles: (query: string) => ["search", "titles", query] as const,
};

export const useTitleSearch = (query: string) =>
  useQuery({
    queryKey: searchKeys.titles(query),
    queryFn: ({ signal }) => searchTitles(query, { signal }),
    enabled: query.trim().length >= 2,
  });
