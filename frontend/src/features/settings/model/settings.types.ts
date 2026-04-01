export type SettingsSectionId = "profile" | "theme" | "auth";

export type SettingsSectionTo =
  | "/settings/profile"
  | "/settings/theme"
  | "/settings/auth";

export type SettingsSectionDefinition = {
  id: SettingsSectionId;
  to: SettingsSectionTo;
  label: string;
  description: string;
};
