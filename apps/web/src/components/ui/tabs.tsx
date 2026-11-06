import { cn } from "@/lib/utils";

type TabItem<T extends string> = { value: T; label: string; count?: number };

type TabsProps<T extends string> = {
  ariaLabel: string;
  items: TabItem<T>[];
  value: T;
  onValueChange: (value: T) => void;
  className?: string;
};

// Text tabs with mono counts and no icons; scrolls with an edge fade on phones.
export const Tabs = <T extends string>({ ariaLabel, items, value, onValueChange, className }: TabsProps<T>) => (
  <div
    role="tablist"
    aria-label={ariaLabel}
    className={cn(
      "no-scrollbar edge-fade-x flex gap-4 overflow-x-auto border-b border-[color:var(--line)] whitespace-nowrap sm:[mask-image:none]",
      className,
    )}
  >
    {items.map((item) => {
      const isActive = item.value === value;
      return (
        <button
          key={item.value}
          type="button"
          role="tab"
          aria-selected={isActive}
          onClick={() => onValueChange(item.value)}
          className={cn(
            "min-h-11 py-2 text-[12.5px] text-muted-foreground transition-colors hover:text-foreground sm:min-h-0",
            isActive && "text-foreground shadow-[inset_0_-2px_var(--primary)]",
          )}
        >
          {item.label}
          {item.count !== undefined ? (
            <>
              {" "}
              <span className="ml-0.5 font-mono text-[10.5px] text-[color:var(--faint)]">{item.count}</span>
            </>
          ) : null}
        </button>
      );
    })}
  </div>
);
