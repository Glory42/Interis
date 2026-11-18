import { keepPreviousData, useInfiniteQuery, type QueryKey } from "@tanstack/react-query";
import { ADMIN_PAGE_SIZE, type AdminPage } from "@/features/admin/pagination";

// Offset-paged admin list: a page shorter than ADMIN_PAGE_SIZE means it was the last one.
// Keeps the old rows up while a new search loads, so an open row dialog isn't unmounted.
export const useAdminPagedList = <T>(
  queryKey: QueryKey,
  fetchPage: (page: AdminPage) => Promise<T[]>,
) =>
  useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => fetchPage({ limit: ADMIN_PAGE_SIZE, offset: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length < ADMIN_PAGE_SIZE ? undefined : allPages.length * ADMIN_PAGE_SIZE,
    select: (data) => data.pages.flat(),
    placeholderData: keepPreviousData,
  });
