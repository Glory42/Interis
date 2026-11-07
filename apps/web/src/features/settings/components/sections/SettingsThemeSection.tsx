import { SettingsSectionSkeleton } from "@/components/ui/PageSkeletons";
import { useState } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useUpdateMyTheme } from "@/features/theme/hooks/useTheme";
import { getDefaultThemeId, listThemes, resolveThemeId, type ThemeDefinition } from "@/features/theme/theme-registry";
import { cn } from "@/lib/utils";
import { applyAndPersistTheme } from "@/features/theme/theme-runtime";
import { isApiError } from "@/lib/api-client";

export const SettingsThemeSection = () => {
  const { user, isUserLoading } = useAuth();
  const updateThemeMutation = useUpdateMyTheme();

  const resolvedThemeId = resolveThemeId(user?.themeId);

  const [optimisticThemeId, setOptimisticThemeId] = useState<string | null>(null);
  const activeThemeId = optimisticThemeId ?? resolvedThemeId;

  const [themeError, setThemeError] = useState<string | null>(null);
  const [themeSuccess, setThemeSuccess] = useState<string | null>(null);

  if (isUserLoading || !user) {
    return <SettingsSectionSkeleton label="Loading theme settings" />;
  }

  const handleSelectTheme = async (themeId: string) => {
    if (themeId === activeThemeId || updateThemeMutation.isPending) {
      return;
    }

    setThemeError(null);
    setThemeSuccess(null);

    const previousThemeId = activeThemeId;
    setOptimisticThemeId(themeId);
    applyAndPersistTheme(themeId);

    try {
      const persistedThemeId = await updateThemeMutation.mutateAsync(themeId);
      const resolvedPersistedThemeId = applyAndPersistTheme(persistedThemeId);
      setOptimisticThemeId(resolvedPersistedThemeId);
      setThemeSuccess("Theme saved.");
    } catch (error) {
      applyAndPersistTheme(previousThemeId);
      setOptimisticThemeId(null);

      setThemeError(
        isApiError(error) ? error.message : "Could not save theme right now.",
      );
    }
  };

  const themeOptions = listThemes();
  const defaultThemeId = getDefaultThemeId();

  return (
    <section>
      <h2 className="display-4 text-foreground">Theme</h2>
      <p className="body-s mt-1 text-muted-foreground">Applies as soon as you tap. Saved to your account.</p>

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {themeOptions.map((theme) => (
          <ThemeTile
            key={theme.id}
            theme={theme}
            isActive={theme.id === activeThemeId}
            isDefault={theme.id === defaultThemeId}
            disabled={updateThemeMutation.isPending}
            onSelect={() => void handleSelectTheme(theme.id)}
          />
        ))}
      </div>

      {themeError ? (
        <p role="alert" className="body-s mt-3 text-[color:var(--danger)]">
          {themeError}
        </p>
      ) : null}
      {themeSuccess ? <p className="body-s mt-3 text-primary">{themeSuccess}</p> : null}
    </section>
  );
};

type ThemeTileProps = {
  theme: ThemeDefinition;
  isActive: boolean;
  isDefault: boolean;
  disabled: boolean;
  onSelect: () => void;
};

// The preview carries the theme's own tokens (see index.css), so it shows the real thing.
const ThemeTile = ({ theme, isActive, isDefault, disabled, onSelect }: ThemeTileProps) => (
  <button
    type="button"
    aria-pressed={isActive}
    disabled={disabled}
    onClick={onSelect}
    className={cn(
      "rounded-[3px] text-left transition-[outline-color] disabled:cursor-wait",
      isActive ? "outline-2 outline-offset-2 outline-[color:var(--primary)]" : "outline-2 outline-offset-2 outline-transparent",
    )}
  >
    <div
      data-theme-preview={theme.id}
      className="overflow-hidden rounded-[3px] border border-[color:var(--line)] bg-background text-foreground"
    >
      <div className="slate mono-meta uppercase">
        <span>Interis</span>
        <span>Diary</span>
      </div>
      <div className="p-2.5">
        <p className="font-display text-lg leading-none tracking-tight">Clayface</p>
        <p className="mono-meta mt-1 text-muted-foreground">2026 · 8/10</p>
        <div className="mt-2 flex gap-1" aria-hidden>
          <span className="h-1.5 flex-1 rounded-[1px] bg-[color:var(--film)]" />
          <span className="h-1.5 flex-1 rounded-[1px] bg-[color:var(--series)]" />
        </div>
        <span className="mt-2 inline-block rounded-[2px] bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground">
          Log
        </span>
      </div>
    </div>
    <span className="body-s mt-1.5 flex items-center justify-between gap-2 text-foreground">
      <span className="font-semibold">{theme.label}</span>
      <span className="mono-meta uppercase text-muted-foreground">
        {[isDefault ? "Default" : null, isActive ? "Current" : null].filter(Boolean).join(" · ")}
      </span>
    </span>
  </button>
);
