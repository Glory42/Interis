import type { CSSProperties } from "react";
import type { LucideIcon } from "lucide-react";

export type ProfileFavoritesPanelState =
  | "ready"
  | "loading"
  | "error"
  | "empty"
  | "unsupported";

type ProfileFavoritesCategoryPanelProps = {
  title: string;
  state: ProfileFavoritesPanelState;
  icon: LucideIcon;
  accentColor: string;
  items?: string[];
  emptyText?: string;
  errorText?: string;
  loadingText?: string;
  unsupportedText?: string;
};

export const ProfileFavoritesCategoryPanel = ({
  title,
  state,
  icon: Icon,
  accentColor,
  items = [],
  emptyText = "No items yet.",
  errorText = "Could not load this section right now.",
  loadingText = "Loading...",
  unsupportedText = "This category is not supported yet.",
}: ProfileFavoritesCategoryPanelProps) => {
  const accentStyle: CSSProperties = {
    color: accentColor,
  };

  const resolvedItems =
    state === "ready" && items.length > 0
      ? items
      : [
          state === "loading"
            ? loadingText
            : state === "error"
              ? errorText
              : state === "unsupported"
                ? unsupportedText
                : emptyText,
        ];

  return (
    <section
      className="space-y-2 border p-4 profile-shell-border profile-shell-panel"
      aria-disabled={state === "unsupported"}
    >
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-3.5 w-3.5" style={accentStyle} aria-hidden="true" />
        <span
          className="font-mono text-[9px] uppercase tracking-[0.16em]"
          style={accentStyle}
        >
          {title}
        </span>
      </div>

      <div className="space-y-2">
        {resolvedItems.map((item, index) => (
          <div key={`${title}-item-${index}`} className="flex items-center gap-2">
            <div
              className="h-1.5 w-1.5 shrink-0 rounded-full"
              style={{ backgroundColor: accentColor }}
            />
            <p className="truncate font-mono text-[10px] profile-shell-muted">{item}</p>
          </div>
        ))}
      </div>
    </section>
  );
};
