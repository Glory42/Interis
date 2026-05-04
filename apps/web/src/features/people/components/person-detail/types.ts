export type CreditMediaTab = "combined" | "movies" | "tv";
export type CreditRoleTab = "cast" | "crew";

export const mediaTabLabelMap: Record<CreditMediaTab, string> = {
  combined: "Combined",
  movies: "Movies",
  tv: "TV",
};

export const roleTabLabelMap: Record<CreditRoleTab, string> = {
  cast: "Cast",
  crew: "Crew",
};
