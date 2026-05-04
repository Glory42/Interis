import { Link } from "@tanstack/react-router";
import { useMatchRoute } from "@tanstack/react-router";
import { Layers, Lock, Palette, Trophy, User } from "lucide-react";
import { settingsSections } from "@/features/settings/model/settings.constants";

const tabClass =
  "flex w-full items-center gap-3 border-b border-l-2 px-4 py-3 text-left font-mono text-[11px] uppercase tracking-[0.16em] no-underline transition-all last:border-b-0";

const iconBySection = {
  profile: User,
  theme: Palette,
  auth: Lock,
  genres: Layers,
  favorites: Trophy,
} as const;

export const SettingsTabs = () => {
  const matchRoute = useMatchRoute();

  return (
    <nav className="shrink-0 sm:w-44">
      <div className="space-y-0 border settings-shell-border">
        {settingsSections.map((section) => {
          const Icon = iconBySection[section.id];
          const isActive = Boolean(matchRoute({ to: section.to }));

          return (
            <Link
              key={section.id}
              to={section.to}
              className={tabClass}
              style={
                isActive
                  ? {
                      borderColor:
                        "var(--settings-shell-row-border) var(--settings-shell-row-border) var(--settings-shell-row-border) var(--settings-shell-accent)",
                      background:
                        "color-mix(in srgb, var(--settings-shell-accent) 10%, transparent)",
                      color: "var(--settings-shell-accent)",
                    }
                  : {
                      borderColor:
                        "var(--settings-shell-row-border) var(--settings-shell-row-border) var(--settings-shell-row-border) transparent",
                      background: "transparent",
                      color: "var(--settings-shell-dim)",
                    }
              }
              viewTransition
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>{section.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
