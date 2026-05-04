import { useQuery } from "@tanstack/react-query";
import { getPersonDetailBySlug } from "@/features/people/api";
import type { PersonRouteRole } from "@/features/people/shared";

export const peopleKeys = {
  all: ["people"] as const,
  detail: (role: PersonRouteRole, slug: string) =>
    ["people", "detail", role, slug] as const,
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
