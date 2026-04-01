import { Badge } from "@/components/ui/badge";
import type { ThemeDefinition } from "@/features/theme/theme-registry";

type SettingsThemeOptionCardProps = {
  theme: ThemeDefinition;
  isActive: boolean;
  isPending: boolean;
  onSelect: (themeId: string) => void;
};

export const SettingsThemeOptionCard = ({
  theme,
  isActive,
  isPending,
  onSelect,
}: SettingsThemeOptionCardProps) => {
  return (
    <button
      type="button"
      onClick={() => onSelect(theme.id)}
      disabled={isPending}
      className={
        "w-full rounded-xl border p-3 text-left transition " +
        (isActive
          ? "border-primary bg-primary/10"
          : "border-border/70 bg-card hover:border-primary/60 hover:bg-secondary/35")
      }
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-foreground">{theme.label}</p>
        {isActive ? <Badge variant="primary">Active</Badge> : null}
      </div>

      <div className="mb-2 flex gap-1">
        {(theme.preview?.swatches ?? []).map((swatch) => (
          <span
            key={`${theme.id}-${swatch}`}
            className="h-4 w-4 rounded-full border border-border/50"
            style={{ backgroundColor: swatch }}
            aria-hidden="true"
          />
        ))}
      </div>

      <p className="text-xs text-muted-foreground">{theme.description}</p>
    </button>
  );
};
