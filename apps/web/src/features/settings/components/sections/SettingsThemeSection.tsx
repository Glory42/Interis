import { useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useUpdateMyTheme } from "@/features/theme/hooks/useTheme";
import { listThemes, resolveThemeId } from "@/features/theme/theme-registry";
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
    return (
      <div className="border px-4 py-3 text-sm settings-shell-border settings-shell-muted settings-shell-panel">
        <p className="flex items-center gap-2">
          <Spinner /> Loading theme settings...
        </p>
      </div>
    );
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

  return (
    <div className="border p-6 sm:p-8 space-y-6 settings-shell-border settings-shell-panel">
      <div>
        <p className="mb-1 text-lg font-bold text-foreground">Appearance</p>
        <p className="text-sm settings-shell-muted">
          Choose between Rose Pine, NULL://LOG, Tokyo Night, and AMOLED. Selection applies immediately.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {themeOptions.map((theme) => {
          const isActive = theme.id === activeThemeId;

          return (
            <button
              key={theme.id}
              type="button"
              onClick={() => {
                void handleSelectTheme(theme.id);
              }}
              disabled={updateThemeMutation.isPending}
              className={
                "w-full rounded-xl border p-4 text-left transition-all " +
                (isActive
                  ? "settings-shell-active-option"
                  : "settings-shell-border settings-shell-input")
              }
            >
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
                    {(theme.preview?.swatches ?? []).map((swatch) => (
                      <span
                        key={`${theme.id}-${swatch}`}
                        className="h-3.5 w-3.5 rounded-full border border-white/10"
                        style={{ backgroundColor: swatch }}
                        aria-hidden="true"
                      />
                    ))}
                  </div>

                  <span
                    className={
                      "text-sm font-semibold " +
                      (isActive ? "settings-shell-accent" : "text-foreground")
                    }
                  >
                    {theme.label}
                  </span>

                  {isActive ? (
                    <span
                      className="rounded-full px-1.5 py-0.5 text-xs font-medium"
                      style={{ background: "var(--settings-shell-accent)", color: "var(--primary-foreground)" }}
                    >
                      Active
                    </span>
                  ) : null}
                </div>

                <span className="flex h-4 w-4 items-center justify-center rounded-full border settings-shell-border">
                  {isActive ? <span className="h-2 w-2 rounded-full settings-shell-dot" aria-hidden="true" /> : null}
                </span>
              </div>

              <p className="text-xs settings-shell-dim-text">{theme.description}</p>
            </button>
          );
        })}
      </div>

      {themeError ? (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {themeError}
        </p>
      ) : null}

      {themeSuccess ? (
        <p className="border px-3 py-2 text-sm settings-shell-border settings-shell-accent settings-shell-active-pill">
          {themeSuccess}
        </p>
      ) : null}
    </div>
  );
};
