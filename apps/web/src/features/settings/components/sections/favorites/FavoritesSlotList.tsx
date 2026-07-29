import { X } from "lucide-react";
import { getPosterUrl } from "@/features/films/components/utils";
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
        <div key={`${category}-slot-${index + 1}`} className="flex items-center gap-3">
          <span className="w-4 shrink-0 text-right text-xs settings-shell-muted">{index + 1}.</span>

          <button
            type="button"
            onClick={() => onOpenSlotPicker(category, index)}
            className="flex flex-1 items-center gap-3 rounded-lg border px-3 py-2 text-left focus:outline-none transition-colors settings-shell-border settings-shell-input hover:border-[color:var(--settings-shell-accent)]"
            disabled={isBusy}
          >
            {slot ? (
              <span
                className="h-10 w-7 shrink-0 overflow-hidden rounded-md border settings-shell-border"
                style={{ background: "color-mix(in srgb, var(--settings-shell-bg) 85%, black)" }}
              >
                {slot.posterPath ? (
                  <img
                    src={getPosterUrl(slot.posterPath)}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : null}
              </span>
            ) : null}

            <span className={"text-sm " + (slot ? "text-foreground" : "settings-shell-muted")}>
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
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      ))}
    </div>
  );
};
