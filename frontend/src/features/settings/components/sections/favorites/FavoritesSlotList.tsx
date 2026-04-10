import { X } from "lucide-react";
import type { TopPickCategoryKey, TopPickSlot } from "./models";

type FavoritesSlotListProps = {
  category: TopPickCategoryKey;
  slots: Array<TopPickSlot | null>;
  isBusy: boolean;
  onOpenSlotPicker: (category: TopPickCategoryKey, slotIndex: number) => void;
  onClearSlot: (category: TopPickCategoryKey, slotIndex: number) => void;
};

export const FavoritesSlotList = ({
  category,
  slots,
  isBusy,
  onOpenSlotPicker,
  onClearSlot,
}: FavoritesSlotListProps) => {
  return (
    <div className="space-y-2">
      {slots.map((slot, index) => (
        <div key={`${category}-slot-${index + 1}`} className="flex items-center gap-2">
          <span className="w-4 shrink-0 text-right font-mono text-[9px] settings-shell-muted">
            {index + 1}.
          </span>

          <button
            type="button"
            onClick={() => onOpenSlotPicker(category, index)}
            className="flex-1 border px-3 py-1.5 text-left font-mono text-xs focus:outline-none transition-colors settings-shell-border settings-shell-input hover:border-[color:var(--profile-shell-accent)]"
            disabled={isBusy}
          >
            <span className={slot ? "text-foreground" : "settings-shell-muted"}>
              {slot?.title ?? `${category === "cinema" ? "Cinema" : "Serial"} #${index + 1}`}
            </span>
          </button>

          <button
            type="button"
            className="shrink-0 p-1 settings-shell-muted transition-colors hover:text-foreground disabled:opacity-40"
            onClick={() => onClearSlot(category, index)}
            disabled={!slot || isBusy}
            aria-label={`Clear ${category} slot ${index + 1}`}
          >
            <X className="h-3 w-3" aria-hidden="true" />
          </button>
        </div>
      ))}
    </div>
  );
};
