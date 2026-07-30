import { useLayoutEffect, useRef, useState } from "react";
import type { FeedFilter } from "@/features/feed/components/FeedActivityList";
import { cn } from "@/lib/utils";

type FeedFilterTabsProps = {
  activeFilter: FeedFilter;
  onFilterChange: (filter: FeedFilter) => void;
};

const TABS: Array<{ id: FeedFilter; label: string; color: string }> = [
  { id: "all", label: "All", color: "var(--primary)" },
  { id: "cinema", label: "Cinema", color: "var(--module-cinema)" },
  { id: "serial", label: "Serial", color: "var(--module-serial)" },
];

type IndicatorRect = { left: number; width: number };

// A single sliding indicator (measured from the DOM, not percentage math) so
// it lines up exactly under whichever tab is active and glides between them
// instead of each tab independently flashing its own highlight.
export const FeedFilterTabs = ({ activeFilter, onFilterChange }: FeedFilterTabsProps) => {
  const buttonRefs = useRef<Partial<Record<FeedFilter, HTMLButtonElement>>>({});
  const [indicator, setIndicator] = useState<IndicatorRect | null>(null);

  useLayoutEffect(() => {
    const activeButton = buttonRefs.current[activeFilter];
    if (activeButton) {
      setIndicator({ left: activeButton.offsetLeft, width: activeButton.offsetWidth });
    }
  }, [activeFilter]);

  const activeColor = TABS.find((tab) => tab.id === activeFilter)?.color ?? "var(--primary)";

  return (
    <div className="relative inline-flex items-center gap-1">
      {indicator ? (
        <div
          className="absolute inset-y-0 rounded-full border transition-all duration-300 ease-out"
          style={{
            left: indicator.left,
            width: indicator.width,
            borderColor: activeColor,
            background: `color-mix(in srgb, ${activeColor} 14%, transparent)`,
          }}
        />
      ) : null}

      {TABS.map((tab) => {
        const isActive = activeFilter === tab.id;

        return (
          <button
            key={tab.id}
            ref={(el) => {
              if (el) {
                buttonRefs.current[tab.id] = el;
              }
            }}
            type="button"
            className={cn(
              "theme-kicker relative z-10 px-4 py-1.5 text-[10px] uppercase transition-colors duration-200",
              !isActive && "text-muted-foreground hover:text-foreground",
            )}
            style={isActive ? { color: tab.color } : undefined}
            onClick={() => onFilterChange(tab.id)}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};
