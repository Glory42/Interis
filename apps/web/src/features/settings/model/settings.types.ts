export type SettingsSectionId =
  | "profile"
  | "theme"
  | "auth"
  | "genres"
  | "favorites"
  | "blocked"
  | "data"
  | "notifications";

export type SettingsSectionTo =
  | "/settings/profile"
  | "/settings/theme"
  | "/settings/auth"
  | "/settings/genres"
  | "/settings/favorites"
  | "/settings/blocked"
  | "/settings/data"
  | "/settings/notifications";

export type SettingsSectionDefinition = {
  id: SettingsSectionId;
  to: SettingsSectionTo;
  number: string;
  label: string;
  group: "profile" | "look" | "account";
};
