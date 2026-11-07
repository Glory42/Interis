import type { ReactNode } from "react";
import { Link, useMatchRoute } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { settingsSections } from "@/features/settings/model/settings.constants";
import { getThemeById } from "@/features/theme/theme-registry";
import { PHONE_QUERY, useMediaQuery } from "@/lib/use-media-query";
import { cn } from "@/lib/utils";

type SettingsLayoutProps = {
  children: ReactNode;
};

const navLink = "flex gap-2 border-l-2 px-2.5 py-1.5 text-sm transition-colors";

// Desktop: a numbered list down the side. Phones: /settings is the index, and each section gets a way back.
export const SettingsLayout = ({ children }: SettingsLayoutProps) => {
  const { user } = useAuth();
  const matchRoute = useMatchRoute();
  const isPhone = useMediaQuery(PHONE_QUERY);
  const active = settingsSections.find((section) => Boolean(matchRoute({ to: section.to })));

  if (isPhone) {
    return (
      <div className="min-h-[80vh]">
        {active ? (
          <div className="flex h-11 items-center justify-between border-b border-[color:var(--line)] px-4">
            <Link to="/settings" className="body-s inline-flex items-center gap-1 text-foreground">
              <ChevronLeft aria-hidden className="size-4" />
              Settings
            </Link>
            <span className="mono-meta uppercase text-foreground">{active.label}</span>
            <span className="w-16" aria-hidden />
          </div>
        ) : null}
        <div className="px-4 py-4">{children}</div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="rounded-[3px] border border-[color:var(--line)]">
        <div className="slate mono-meta rounded-t-[3px] uppercase">
          <span>{`Interis · Settings · @${user?.username ?? ""}`}</span>
          <span>{`Theme ${getThemeById(user?.themeId).label}`}</span>
        </div>
        <div className="grid gap-6 p-4 sm:grid-cols-[13rem_1fr] sm:p-6">
          <aside>
            <h1 className="display-3 mb-3 text-foreground">Settings</h1>
            <nav aria-label="Settings sections" className="flex flex-col">
              {settingsSections.map((section) => {
                const isActive = active?.id === section.id;
                return (
                  <Link
                    key={section.id}
                    to={section.to}
                    aria-current={isActive ? "page" : undefined}
                    aria-label={`${section.number} ${section.label}`}
                    className={cn(
                      navLink,
                      isActive
                        ? "border-[color:var(--primary)] bg-primary/[0.07] text-foreground"
                        : "border-transparent text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <b className="mono-meta pt-0.5 opacity-60">{section.number}</b>
                    {section.label}
                  </Link>
                );
              })}
              <Link
                to="/settings/auth"
                hash="delete-account"
                className={cn(navLink, "mt-4 border-transparent text-[color:var(--danger)] hover:opacity-80")}
              >
                Delete account
              </Link>
            </nav>
          </aside>
          <div className="min-w-0 space-y-6">{children}</div>
        </div>
      </div>
    </div>
  );
};
