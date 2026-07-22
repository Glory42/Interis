import { Link, useMatchRoute } from "@tanstack/react-router";
import { Download, Layers, Lock, Palette, ShieldOff, Trophy, User } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";
import { settingsSections } from "@/features/settings/model/settings.constants";
import type { SettingsSectionId } from "@/features/settings/model/settings.types";

const iconBySection = {
  profile: User,
  theme: Palette,
  auth: Lock,
  genres: Layers,
  favorites: Trophy,
  blocked: ShieldOff,
  data: Download,
} as const;

const tabClass =
  "relative z-10 flex items-center gap-2 whitespace-nowrap px-4 py-3 text-sm transition-colors";

type IndicatorRect = { left: number; width: number };

export const SettingsTabs = () => {
  const matchRoute = useMatchRoute();
  const tabRefs = useRef<Partial<Record<SettingsSectionId, HTMLAnchorElement>>>({});
  const [indicator, setIndicator] = useState<IndicatorRect | null>(null);

  const activeSectionId = settingsSections.find((section) =>
    Boolean(matchRoute({ to: section.to })),
  )?.id;

  useLayoutEffect(() => {
    if (!activeSectionId) {
      return;
    }

    const activeElement = tabRefs.current[activeSectionId];
    if (activeElement) {
      setIndicator({ left: activeElement.offsetLeft, width: activeElement.offsetWidth });
    }
  }, [activeSectionId]);

  return (
    <nav
      className="relative flex gap-0 overflow-x-auto border-b settings-shell-row-border"
      aria-label="Settings sections"
    >
      {indicator ? (
        <div
          className="absolute bottom-0 h-0.5 transition-all duration-300 ease-out"
          style={{
            left: indicator.left,
            width: indicator.width,
            background: "var(--settings-shell-accent)",
          }}
        />
      ) : null}

      {settingsSections.map((section) => {
        const Icon = iconBySection[section.id];
        const isActive = activeSectionId === section.id;

        return (
          <Link
            key={section.id}
            ref={(el) => {
              if (el) {
                tabRefs.current[section.id] = el;
              }
            }}
            to={section.to}
            className={tabClass}
            style={{
              color: isActive ? "var(--settings-shell-accent)" : "var(--settings-shell-muted)",
            }}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{section.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};
