import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { SETTINGS_GROUP_LABEL, settingsSections } from "@/features/settings/model/settings.constants";
import type { SettingsSectionId } from "@/features/settings/model/settings.types";
import { maskEmail } from "@/features/settings/model/mask-email";
import { getThemeById } from "@/features/theme/theme-registry";

const groups = Object.keys(SETTINGS_GROUP_LABEL) as (keyof typeof SETTINGS_GROUP_LABEL)[];

// The phone's /settings: every section, with what it's set to now.
export const SettingsIndex = () => {
  const { user, logout, isLogoutPending } = useAuth();
  if (!user) return null;

  const valueOf: Partial<Record<SettingsSectionId, string>> = {
    profile: [user.username, user.location].filter(Boolean).join(" · "),
    genres: user.favoriteGenres?.length ? user.favoriteGenres.join(", ") : "None picked",
    theme: getThemeById(user.themeId).label,
    auth: user.email ? maskEmail(user.email) : undefined,
    data: "CSV export, import",
  };

  return (
    <div>
      <h1 className="display-3 mb-2 text-foreground">Settings</h1>
      {groups.map((group) => (
        <section key={group}>
          <h2 className="kicker mt-5 mb-1 text-muted-foreground">{SETTINGS_GROUP_LABEL[group]}</h2>
          {settingsSections
            .filter((section) => section.group === group)
            .map((section) => (
              <Link
                key={section.id}
                to={section.to}
                className="body flex items-center justify-between gap-3 border-b border-[color:var(--line)] py-2.5 text-foreground"
              >
                <span>{section.label}</span>
                <span className="body-s flex min-w-0 items-center gap-1 text-muted-foreground">
                  <span className="truncate">{valueOf[section.id] ?? ""}</span>
                  <ChevronRight aria-hidden className="size-3.5 shrink-0" />
                </span>
              </Link>
            ))}
        </section>
      ))}
      <div className="mt-6 flex flex-col items-start gap-3">
        <Link to="/settings/data" hash="delete-account" className="body text-[color:var(--danger)]">
          Delete account
        </Link>
        <button type="button" disabled={isLogoutPending} onClick={() => void logout()} className="body text-foreground disabled:opacity-50">
          Sign out
        </button>
      </div>
    </div>
  );
};
