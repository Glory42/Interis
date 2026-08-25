import type { ReactNode } from "react";
import { SettingsTabs } from "@/features/settings/components/SettingsTabs";

type SettingsLayoutProps = {
  children: ReactNode;
};

export const SettingsLayout = ({ children }: SettingsLayoutProps) => {
  return (
    <div className="min-h-[80vh] settings-shell">
      <div className="mx-auto w-full max-w-5xl px-4 py-8">
        <div className="mb-8">
          <h1 className="mb-1 text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-sm settings-shell-muted">
            Manage your account preferences and appearance.
          </p>
        </div>

        <SettingsTabs />

        <div className="mt-8 space-y-6">{children}</div>
      </div>
    </div>
  );
};
