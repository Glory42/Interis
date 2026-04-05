import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { SettingsThemeOptionCard } from "@/features/settings/components/SettingsThemeOptionCard";
import { useUpdateMyTheme } from "@/features/theme/hooks/useTheme";
import { listThemes, resolveThemeId } from "@/features/theme/theme-registry";
import { applyAndPersistTheme } from "@/features/theme/theme-runtime";
import { isApiError } from "@/lib/api-client";

export const SettingsThemeSection = () => {
  const { user, isUserLoading } = useAuth();
  const updateThemeMutation = useUpdateMyTheme();

  const resolvedThemeId = resolveThemeId(user?.themeId);

  const [optimisticThemeId, setOptimisticThemeId] = useState<string | null>(
    null,
  );
  const activeThemeId = optimisticThemeId ?? resolvedThemeId;

  const [themeError, setThemeError] = useState<string | null>(null);
  const [themeSuccess, setThemeSuccess] = useState<string | null>(null);

  if (isUserLoading || !user) {
    return (
      <div className=" border border-border/70 bg-card/60 p-4 text-sm text-muted-foreground">
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

      if (isApiError(error)) {
        setThemeError(error.message);
        return;
      }

      setThemeError("Could not save theme right now.");
    }
  };

  const themeOptions = listThemes();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
        <CardDescription>
          Choose between Rose Pine, NULL://LOG, and Gruvbox. Selection applies immediately and syncs to your account.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {themeOptions.map((theme) => (
            <SettingsThemeOptionCard
              key={theme.id}
              theme={theme}
              isActive={theme.id === activeThemeId}
              isPending={updateThemeMutation.isPending}
              onSelect={handleSelectTheme}
            />
          ))}
        </div>

        {themeError ? (
          <p className=" border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {themeError}
          </p>
        ) : null}

        {themeSuccess ? (
          <p className=" border border-primary/40 bg-primary/10 px-3 py-2 text-sm text-primary">
            {themeSuccess}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
};
