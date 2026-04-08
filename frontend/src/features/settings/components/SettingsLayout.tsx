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
          <h1 className="mb-1 font-mono text-2xl font-bold text-foreground">Settings</h1>
          <p className="font-mono text-xs settings-shell-muted">
            Manage your account preferences and appearance.
          </p>
        </div>

        <div className="flex flex-col gap-8 sm:flex-row">
          <SettingsTabs />
          <div className="min-w-0 flex-1 space-y-6">{children}</div>
        </div>
      </div>
    </div>
  );
};
