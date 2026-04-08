export type SettingsSectionId =
  | "profile"
  | "theme"
  | "auth"
  | "genres"
  | "favorites";

export type SettingsSectionTo =
  | "/settings/profile"
  | "/settings/theme"
  | "/settings/auth"
  | "/settings/genres"
  | "/settings/favorites";

export type SettingsSectionDefinition = {
  id: SettingsSectionId;
  to: SettingsSectionTo;
  label: string;
  description: string;
};
