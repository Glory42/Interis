import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import {
  getPersonCredits,
  getPersonDetailBySlug,
  PERSON_CREDITS_PAGE_SIZE,
} from "@/features/people/api";
import type {
  CreditMediaTab,
  CreditRoleTab,
  PersonRouteRole,
} from "@/features/people/shared";

export const peopleKeys = {
  all: ["people"] as const,
  detail: (role: PersonRouteRole, slug: string) =>
    ["people", "detail", role, slug] as const,
  credits: (role: PersonRouteRole, slug: string, media: CreditMediaTab, type: CreditRoleTab) =>
    ["people", "credits", role, slug, media, type] as const,
};

export const usePersonDetail = (
  role: PersonRouteRole,
  slug: string,
  enabled = true,
) =>
  useQuery({
    queryKey: peopleKeys.detail(role, slug),
    queryFn: ({ signal }) => getPersonDetailBySlug(role, slug, { signal }),
    enabled,
  });

export const usePersonCredits = (
  role: PersonRouteRole,
  slug: string,
  media: CreditMediaTab,
  type: CreditRoleTab,
  enabled = true,
) =>
  useInfiniteQuery({
    queryKey: peopleKeys.credits(role, slug, media, type),
    queryFn: ({ pageParam, signal }) =>
      getPersonCredits(role, slug, { media, type, offset: pageParam }, { signal }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((sum, page) => sum + page.items.length, 0);
      return lastPage.items.length === PERSON_CREDITS_PAGE_SIZE && loaded < lastPage.total
        ? loaded
        : undefined;
    },
    select: (data) => data.pages.flatMap((page) => page.items),
    enabled,
  });
