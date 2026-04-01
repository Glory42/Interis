import type { ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { SettingsTabs } from "@/features/settings/components/SettingsTabs";
import { settingsSections } from "@/features/settings/model/settings.constants";

type SettingsLayoutProps = {
  children: ReactNode;
};

export const SettingsLayout = ({ children }: SettingsLayoutProps) => {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  const activeSection =
    settingsSections.find((section) => pathname.startsWith(section.to)) ??
    settingsSections[0];

  return (
    <PageWrapper
      title="Settings"
      subtitle="Manage profile, theme, and authentication preferences."
    >
      <SettingsTabs />
      <p className="mb-5 mt-3 text-sm text-muted-foreground">
        {activeSection?.description}
      </p>
      {children}
    </PageWrapper>
  );
};
