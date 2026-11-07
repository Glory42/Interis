import { useState } from "react";
import { Ellipsis, Plus } from "lucide-react";
import { OutlinedRank } from "@/components/film/OutlinedRank";
import { cn } from "@/lib/utils";
import type { TopPickCategoryKey, TopPickSlot } from "./models";
import { getPosterUrl } from "@/features/media/tmdb-images";

type TopPickSlotsProps = {
  category: TopPickCategoryKey;
  slots: Array<TopPickSlot | null>;
  isBusy: boolean;
  onPick: (category: TopPickCategoryKey, slotIndex: number) => void;
  onMove: (category: TopPickCategoryKey, slotIndex: number, step: -1 | 1) => void;
  onRemove: (category: TopPickCategoryKey, slotIndex: number) => void;
};

const menuItem = "block w-full px-4 py-2 text-left text-xs text-muted-foreground hover:bg-foreground/5 hover:text-foreground disabled:opacity-40 disabled:hover:bg-transparent";

export const TopPickSlots = ({ category, slots, isBusy, onPick, onMove, onRemove }: TopPickSlotsProps) => {
  const noun = category === "movie" ? "film" : "series";
  return (
    <div className="grid grid-cols-4 gap-2">
      {slots.map((slot, index) => {
        const number = String(index + 1).padStart(2, "0");
        return slot ? (
          <FilledSlot
            key={`${category}-${slot.mediaSourceId}`}
            slot={slot}
            index={index}
            label={`${slot.title}, ${noun} ${number} actions`}
            isBusy={isBusy}
            onReplace={() => onPick(category, index)}
            onMove={(step) => onMove(category, index, step)}
            onRemove={() => onRemove(category, index)}
          />
        ) : (
          <button
            key={`${category}-empty-${index}`}
            type="button"
            disabled={isBusy}
            onClick={() => onPick(category, index)}
            aria-label={`Add a ${noun} to slot ${number}`}
            className="body-s grid aspect-[2/3] place-items-center rounded-[2px] border border-dashed border-[color:var(--line-strong)] text-center text-muted-foreground hover:border-[color:var(--primary)] hover:text-foreground"
          >
            <span className="flex flex-col items-center gap-1">
              <Plus aria-hidden className="size-4" />
              {`Add a ${noun}`}
            </span>
          </button>
        );
      })}
    </div>
  );
};

type FilledSlotProps = {
  slot: TopPickSlot;
  index: number;
  label: string;
  isBusy: boolean;
  onReplace: () => void;
  onMove: (step: -1 | 1) => void;
  onRemove: () => void;
};

const FilledSlot = ({ slot, index, label, isBusy, onReplace, onMove, onRemove }: FilledSlotProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const run = (action: () => void) => () => {
    setIsOpen(false);
    action();
  };

  return (
    <div
      className="relative"
      onBlur={(event) => !event.currentTarget.contains(event.relatedTarget) && setIsOpen(false)}
      onKeyDown={(event) => event.key === "Escape" && setIsOpen(false)}
    >
      <div className="aspect-[2/3] overflow-hidden rounded-[2px] bg-foreground/10">
        {slot.posterPath ? <img src={getPosterUrl(slot.posterPath)} alt="" className="h-full w-full object-cover" /> : null}
      </div>
      <OutlinedRank value={index + 1} className="absolute top-0 left-1" />
      <p className="caption mt-1 truncate text-foreground">{slot.title}</p>
      <button
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        disabled={isBusy}
        onClick={() => setIsOpen((open) => !open)}
        className="absolute right-1 bottom-6 rounded-[2px] bg-black/75 px-1.5 py-0.5 text-white"
      >
        <Ellipsis aria-hidden className="size-3.5" />
      </button>
      {isOpen ? (
        <div role="menu" className={cn("surface-card absolute top-full right-0 z-40 mt-1 min-w-40 overflow-hidden")}>
          <button type="button" role="menuitem" className={menuItem} onClick={run(onReplace)}>
            Replace…
          </button>
          <button type="button" role="menuitem" className={menuItem} disabled={index === 0} onClick={run(() => onMove(-1))}>
            Move left
          </button>
          <button type="button" role="menuitem" className={menuItem} disabled={index === 3} onClick={run(() => onMove(1))}>
            Move right
          </button>
          <button type="button" role="menuitem" className={cn(menuItem, "text-[color:var(--danger)]")} onClick={run(onRemove)}>
            Remove from Top 4
          </button>
        </div>
      ) : null}
    </div>
  );
};
