import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { searchTitles } from "@/api/search";
import { searchUsers } from "@/api/profile";
import { useDebouncedValue } from "./useDebouncedValue";

export const searchKeys = {
  titles: (query: string) => ["search", "titles", query] as const,
  users: (query: string) => ["search", "users", query] as const,
};

export const useSearch = (rawQuery: string) => {
  const query = useDebouncedValue(rawQuery.trim(), 350);
  const enabled = query.length >= 2;

  const titlesQuery = useQuery({
    queryKey: searchKeys.titles(query),
    queryFn: ({ signal }) => searchTitles(query, { signal }),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 5 * 60_000,
  });

  const usersQuery = useQuery({
    queryKey: searchKeys.users(query),
    queryFn: ({ signal }) => searchUsers(query, { signal }),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 5 * 60_000,
  });

  return { query, enabled, titlesQuery, usersQuery };
};
