import { useState } from "react";
import { AdminMoviesPanel } from "@/features/admin/components/AdminMoviesPanel";
import { AdminSerialsPanel } from "@/features/admin/components/AdminSerialsPanel";

const SUB_TABS = [
  { value: "movies", label: "Movies" },
  { value: "serials", label: "Serials" },
] as const;

type MediaSubTab = (typeof SUB_TABS)[number]["value"];

export const AdminMediaPanel = () => {
  const [subTab, setSubTab] = useState<MediaSubTab>("movies");

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {SUB_TABS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setSubTab(option.value)}
            className={
              "border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors " +
              (subTab === option.value
                ? "border-primary/45 bg-primary/10 text-primary"
                : "border-border/70 text-muted-foreground hover:text-foreground")
            }
          >
            {option.label}
          </button>
        ))}
      </div>

      {subTab === "movies" ? <AdminMoviesPanel /> : null}
      {subTab === "serials" ? <AdminSerialsPanel /> : null}
    </div>
  );
};
