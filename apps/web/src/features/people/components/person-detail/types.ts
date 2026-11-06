import type { CreditMediaTab, CreditRoleTab } from "@/features/people/shared";

export type { CreditMediaTab, CreditRoleTab };

export const mediaTabLabelMap: Record<CreditMediaTab, string> = {
  combined: "Combined",
  movies: "Movies",
  tv: "TV",
};

export const roleTabLabelMap: Record<CreditRoleTab, string> = {
  cast: "Cast",
  crew: "Crew",
};
