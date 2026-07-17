export type SettingsSectionId =
  | "profile"
  | "theme"
  | "auth"
  | "genres"
  | "favorites"
  | "blocked"
  | "data";

export type SettingsSectionTo =
  | "/settings/profile"
  | "/settings/theme"
  | "/settings/auth"
  | "/settings/genres"
  | "/settings/favorites"
  | "/settings/blocked"
  | "/settings/data";

export type SettingsSectionDefinition = {
  id: SettingsSectionId;
  to: SettingsSectionTo;
  label: string;
  description: string;
};
