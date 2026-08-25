import { useState } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useUpdateMyTheme } from "@/features/theme/hooks/useTheme";
import { listThemes, resolveThemeId } from "@/features/theme/theme-registry";
import { applyAndPersistTheme } from "@/features/theme/theme-runtime";

export const NavbarThemeSubmenu = () => {
  const { user } = useAuth();
  const updateThemeMutation = useUpdateMyTheme();
  const resolvedThemeId = resolveThemeId(user?.themeId);
  const [optimisticThemeId, setOptimisticThemeId] = useState<string | null>(null);
  const activeThemeId = optimisticThemeId ?? resolvedThemeId;

  const themes = listThemes();

  const handleSelect = async (themeId: string) => {
    if (themeId === activeThemeId || updateThemeMutation.isPending) return;

    const previousThemeId = activeThemeId;
    setOptimisticThemeId(themeId);
    applyAndPersistTheme(themeId);

    try {
      const persisted = await updateThemeMutation.mutateAsync(themeId);
      setOptimisticThemeId(applyAndPersistTheme(persisted));
    } catch {
      applyAndPersistTheme(previousThemeId);
      setOptimisticThemeId(null);
    }
  };

  return (
    <div
      className="border-t border-border/40 pt-1 mt-1 animate-fade-up"
      role="menu"
      aria-label="Theme options"
    >
      {themes.map((theme) => {
        const isActive = theme.id === activeThemeId;

        return (
          <button
            key={theme.id}
            type="button"
            role="menuitem"
            onClick={() => { void handleSelect(theme.id); }}
            disabled={updateThemeMutation.isPending}
            className={
              "flex w-full items-center gap-2.5 px-2.5 py-1.5 text-left transition-colors " +
              (isActive
                ? "bg-secondary/65 text-foreground"
                : "text-muted-foreground hover:bg-secondary/65 hover:text-foreground")
            }
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              className="shrink-0"
              aria-hidden="true"
            >
              <circle cx="7" cy="7" r="7" fill={theme.preview?.swatches[0] ?? "#000"} />
              <path d="M7 0 A7 7 0 0 1 7 14 Z" fill={theme.preview?.swatches[2] ?? "#fff"} />
              <circle cx="7" cy="7" r="7" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.5" />
            </svg>

            <span className="flex-1 truncate font-mono text-[10px] font-semibold uppercase tracking-[0.12em]">
              {theme.label}
            </span>

            {isActive ? (
              <span className="shrink-0 border border-border/70 px-1 py-px font-mono text-[8px] uppercase tracking-[0.12em] text-primary">
                Active
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
};
